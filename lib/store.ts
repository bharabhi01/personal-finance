import {randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import type {SupabaseClient} from '@supabase/supabase-js';
import {db,isDev} from '@/lib/server';

export type Entry = {amount_paise:number; date:string; description:string; category:string};
export type Expense = Entry & {id:string; source:string};
export type ImportResult = {status:'saved'|'already_saved'; count:number};
export type Store = {
 list():Promise<Expense[]>;
 create(entry:Entry):Promise<Expense>;
 update(id:string,entry:Entry):Promise<Expense>;
 remove(id:string):Promise<void>;
 importBatch(messageId:string,entries:Entry[]):Promise<ImportResult>;
};

/** The ledger for this request, or null when signed out. Development uses a local file and needs no sign-in. */
export async function getStore():Promise<Store|null> {
 if (isDev) return fileStore;
 const client=await db();
 const {data:{user}}=await client.auth.getUser();
 return user ? supabaseStore(client,user.id) : null;
}

function supabaseStore(client:SupabaseClient,userId:string):Store {
 return {
  async list() {
   const rows:Expense[]=[]; let total:number|null=null;
   for (let offset=0;;offset+=1000) {
    const {data,error,count}=await client.from('expenses').select('*',{count:'exact'}).order('date',{ascending:false}).order('id').range(offset,offset+999);
    if (error || !data || (total!==null && count!==total)) throw new Error('The full ledger could not be loaded. No partial totals are shown. Please refresh.');
    total=count; rows.push(...data);
    if (rows.length>=total! || data.length===0) return rows;
   }
  },
  async create(entry) {
   const {data,error}=await client.from('expenses').insert({...entry,user_id:userId,source:'app'}).select().single();
   if (error) throw new Error('Expense could not be saved. No success confirmed.');
   return data;
  },
  async update(id,entry) {
   const {data,error}=await client.from('expenses').update(entry).eq('id',id).eq('user_id',userId).select().single();
   if (error) throw new Error('Expense could not be updated.');
   return data;
  },
  async remove(id) {
   const {data,error}=await client.from('expenses').delete().eq('id',id).eq('user_id',userId).select('id').single();
   if (error || !data) throw new Error('Expense could not be deleted.');
  },
  async importBatch(messageId,entries) {
   const {data,error}=await client.rpc('import_expenses',{message_id:messageId,items:entries});
   if (error) throw new Error('Import rejected. Nothing is confirmed saved.');
   return data;
  },
 };
}

const DEV_FILE='.dev-data.json';
type DevData = {expenses:Expense[]; imports:Record<string,Entry[]>};
const readDev=async():Promise<DevData>=>{try{return JSON.parse(await readFile(DEV_FILE,'utf8'));}catch{return {expenses:[],imports:{}};}};
const writeDev=(data:DevData)=>writeFile(DEV_FILE,JSON.stringify(data,null,1));

const fileStore:Store = {
 async list() {
  return (await readDev()).expenses.sort((a,b)=>b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
 },
 async create(entry) {
  const data=await readDev(), expense={...entry,id:randomUUID(),source:'app'};
  data.expenses.push(expense); await writeDev(data);
  return expense;
 },
 async update(id,entry) {
  const data=await readDev(), expense=data.expenses.find(e=>e.id===id);
  if (!expense) throw new Error('Expense could not be updated.');
  Object.assign(expense,entry); await writeDev(data);
  return expense;
 },
 async remove(id) {
  const data=await readDev(), kept=data.expenses.filter(e=>e.id!==id);
  if (kept.length===data.expenses.length) throw new Error('Expense could not be deleted.');
  await writeDev({...data,expenses:kept});
 },
 async importBatch(messageId,entries) {
  const data=await readDev(), prior=data.imports[messageId];
  if (prior) {
   if (JSON.stringify(prior)!==JSON.stringify(entries)) throw new Error('Same message ID with changed contents');
   return {status:'already_saved',count:entries.length};
  }
  data.imports[messageId]=entries;
  data.expenses.push(...entries.map(e=>({...e,id:randomUUID(),source:'whatsapp'})));
  await writeDev(data);
  return {status:'saved',count:entries.length};
 },
};
