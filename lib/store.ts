import {randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {db,isDev} from '@/lib/server';
import {todayIST} from '@/lib/format';
import {sameEntries} from '@/lib/validation.mjs';

export type Entry = {amount_paise:number; date:string; description:string; category:string; bank:string|null};
export type Expense = Entry & {id:string; source:string};
export type SaveResult = {status:'saved'|'already_saved'; expenses:Expense[]};
export type Store = {
 list():Promise<Expense[]>;
 create(entry:Entry):Promise<Expense>;
 update(id:string,entry:Entry):Promise<Expense>;
 remove(id:string):Promise<void>;
 /** Saves a batch from Instinct once per message ID: an identical retry changes nothing. */
 saveFromMessage(messageId:string,entries:Entry[]):Promise<SaveResult>;
};

/** The ledger for the signed-in browser session, or null when signed out. Development needs no sign-in. */
export async function getStore():Promise<Store|null> {
 if (isDev) return fileStore;
 const client=await db();
 const {data:{user}}=await client.auth.getUser();
 return user ? supabaseStore(client,user.id) : null;
}

/** The owner's ledger for server-to-server calls (Instinct), which have no browser session. */
export function getOwnerStore():Store {
 if (isDev) return fileStore;
 const {NEXT_PUBLIC_SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key,OWNER_USER_ID:owner}=process.env;
 if (!url || !key || !owner) throw new Error('Server is missing SUPABASE_SERVICE_ROLE_KEY or OWNER_USER_ID.');
 return supabaseStore(createClient(url,key,{auth:{persistSession:false}}),owner);
}

function supabaseStore(client:SupabaseClient,userId:string):Store {
 return {
  async list() {
   const rows:Expense[]=[]; let total:number|null=null;
   for (let offset=0;;offset+=1000) {
    const {data,error,count}=await client.from('expenses').select('*',{count:'exact'}).eq('user_id',userId).order('date',{ascending:false}).order('id').range(offset,offset+999);
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
  async saveFromMessage(messageId,entries) {
   const found=await client.from('expenses').select('*').eq('user_id',userId).eq('source_message_id',messageId).order('source_line');
   if (found.error) throw new Error('Could not check for an earlier save. Nothing is confirmed saved.');
   if (found.data.length) return alreadySaved(found.data,entries);
   const rows=entries.map((entry,i)=>({...entry,user_id:userId,source:'whatsapp',source_message_id:messageId,source_line:i+1}));
   const {data,error}=await client.from('expenses').insert(rows).select().order('source_line');
   if (error) throw new Error('Could not save. Nothing is confirmed saved.');
   return {status:'saved',expenses:data};
  },
 };
}

function alreadySaved(saved:Expense[],entries:Entry[]):SaveResult {
 if (!sameEntries(saved,entries)) throw new Error('This message_id was already saved with different contents. Nothing was changed.');
 return {status:'already_saved',expenses:saved};
}

// Development only: a local file stands in for the database, seeded with sample data on first run.
const DEV_FILE='.dev-data.json';
type DevExpense = Expense & {source_message_id?:string; source_line?:number};

const SAMPLE:[number,string,string,number,string|null][]=[
 [3,'Claude Subscription','Subscriptions',2300,'Kotak Bank'],[8,'Netflix','Subscriptions',649,'HDFC Bank'],[12,'Spotify','Subscriptions',119,'HDFC Bank'],
 [5,'Internet bill','Bills',999,'Kotak Bank'],[10,'Electricity','Bills',1840,'Kotak Bank'],
 [2,'Dosa','Food',180,'UPI'],[6,'Groceries','Food',1650,'HDFC Bank'],[11,'Dinner out','Food',920,'HDFC Bank'],[17,'Filter coffee','Food',90,'UPI'],[22,'Swiggy','Food',540,'HDFC Bank'],
 [4,'Cab','Travel',250,'UPI'],[14,'Fuel','Travel',1200,'Kotak Bank'],[20,'Metro card','Travel',500,'UPI'],
 [9,'Shoes','Shopping',3200,'HDFC Bank'],[19,'Books','Shopping',780,'Kotak Bank'],[15,'Pharmacy','Health',430,'UPI'],
];
function sampleExpenses():DevExpense[] {
 const today=todayIST(), [year,month]=today.split('-').map(Number);
 return Array.from({length:6},(_,back)=>SAMPLE.map(([day,description,category,rupees,bank])=>{
  const date=new Date(Date.UTC(year,month-1-back,day)).toISOString().slice(0,10);
  return {id:randomUUID(),date,amount_paise:(rupees+(category==='Subscriptions'||category==='Bills'?0:((day*(back+1))%7)*10))*100,description,category,bank,source:day%3===0?'whatsapp':'app'};
 })).flat().filter(e=>e.date<=today);
}

async function readDev():Promise<DevExpense[]> {
 try { return JSON.parse(await readFile(DEV_FILE,'utf8')); }
 catch { const seeded=sampleExpenses(); await writeDev(seeded); return seeded; }
}
const writeDev=(rows:DevExpense[])=>writeFile(DEV_FILE,JSON.stringify(rows,null,1));

const fileStore:Store = {
 async list() {
  return (await readDev()).sort((a,b)=>b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
 },
 async create(entry) {
  const rows=await readDev(), expense={...entry,id:randomUUID(),source:'app'};
  await writeDev([...rows,expense]);
  return expense;
 },
 async update(id,entry) {
  const rows=await readDev(), expense=rows.find(e=>e.id===id);
  if (!expense) throw new Error('Expense could not be updated.');
  Object.assign(expense,entry); await writeDev(rows);
  return expense;
 },
 async remove(id) {
  const rows=await readDev(), kept=rows.filter(e=>e.id!==id);
  if (kept.length===rows.length) throw new Error('Expense could not be deleted.');
  await writeDev(kept);
 },
 async saveFromMessage(messageId,entries) {
  const rows=await readDev();
  const saved=rows.filter(e=>e.source_message_id===messageId).sort((a,b)=>a.source_line!-b.source_line!);
  if (saved.length) return alreadySaved(saved,entries);
  const created=entries.map((entry,i)=>({...entry,id:randomUUID(),source:'whatsapp',source_message_id:messageId,source_line:i+1}));
  await writeDev([...rows,...created]);
  return {status:'saved',expenses:created};
 },
};
