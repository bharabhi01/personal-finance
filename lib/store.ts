import {randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {db,isDev} from '@/lib/server';
import {todayIST} from '@/lib/format';
import {sameEntries} from '@/lib/validation.mjs';

export type Kind = 'expense'|'income'|'investment'|'savings'|'balance';
/** One ledger row as validated input. `bank` is the account money leaves from (or the account a balance belongs to); `to_bank` is a savings transfer's destination. */
export type Entry = {kind:Kind; amount_paise:number; date:string; description:string; category:string|null; bank:string|null; to_bank:string|null};
export type Transaction = Entry & {id:string; source:string; created_at:string};
export type SaveResult = {status:'saved'|'already_saved'; entries:Transaction[]};
export type Store = {
 list():Promise<Transaction[]>;
 create(entry:Entry):Promise<Transaction>;
 /** Edits a row without changing its kind. */
 update(id:string,entry:Entry):Promise<Transaction>;
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
   const rows:Transaction[]=[]; let total:number|null=null;
   for (let offset=0;;offset+=1000) {
    const {data,error,count}=await client.from('transactions').select('*',{count:'exact'}).eq('user_id',userId).order('date',{ascending:false}).order('id').range(offset,offset+999);
    if (error || !data || (total!==null && count!==total)) throw new Error('The full ledger could not be loaded. No partial totals are shown. Please refresh.');
    total=count; rows.push(...data);
    if (rows.length>=total! || data.length===0) return rows;
   }
  },
  async create(entry) {
   const {data,error}=await client.from('transactions').insert({...entry,user_id:userId,source:'app'}).select().single();
   if (error) throw new Error('Could not be saved. No success confirmed.');
   return data;
  },
  async update(id,entry) {
   const {data,error}=await client.from('transactions').update(entry).eq('id',id).eq('user_id',userId).eq('kind',entry.kind).select().single();
   if (error) throw new Error('Could not be updated.');
   return data;
  },
  async remove(id) {
   const {data,error}=await client.from('transactions').delete().eq('id',id).eq('user_id',userId).select('id').single();
   if (error || !data) throw new Error('Could not be deleted.');
  },
  async saveFromMessage(messageId,entries) {
   const found=await client.from('transactions').select('*').eq('user_id',userId).eq('source_message_id',messageId).order('source_line');
   if (found.error) throw new Error('Could not check for an earlier save. Nothing is confirmed saved.');
   if (found.data.length) return alreadySaved(found.data,entries);
   const rows=entries.map((entry,i)=>({...entry,user_id:userId,source:'whatsapp',source_message_id:messageId,source_line:i+1}));
   const {data,error}=await client.from('transactions').insert(rows).select().order('source_line');
   if (error) throw new Error('Could not save. Nothing is confirmed saved.');
   return {status:'saved',entries:data};
  },
 };
}

function alreadySaved(saved:Transaction[],entries:Entry[]):SaveResult {
 if (!sameEntries(saved,entries)) throw new Error('This message_id was already saved with different contents. Nothing was changed.');
 return {status:'already_saved',entries:saved};
}

// Development only: a local file stands in for the database, seeded with sample data on first run.
const DEV_FILE='.dev-data.json';
type DevRow = Transaction & {source_message_id?:string; source_line?:number};

const SAMPLE_EXPENSES:[number,string,string,number,string][]=[
 [3,'Claude Subscription','Subscriptions',2300,'Kotak Bank'],[8,'Netflix','Subscriptions',649,'HDFC Bank'],[12,'Spotify','Subscriptions',119,'HDFC Bank'],
 [1,'Rent','Housing',18000,'Kotak Bank'],[10,'Electricity','Housing',1840,'Kotak Bank'],[5,'Credit card bill','Bills',4200,'Kotak Bank'],
 [2,'Dosa','Food',180,'Axis Bank'],[6,'Groceries','Groceries',1650,'HDFC Bank'],[11,'Dinner out','Food',920,'HDFC Bank'],[17,'Filter coffee','Food',90,'Axis Bank'],[22,'Swiggy','Food',540,'HDFC Bank'],
 [4,'Cab','Travel',250,'Axis Bank'],[14,'Fuel','Travel',1200,'Kotak Bank'],[20,'Metro card','Travel',500,'Axis Bank'],
 [9,'Shoes','Shopping',3200,'HDFC Bank'],[19,'Books','Shopping',780,'Kotak Bank'],[15,'Pharmacy','Health',430,'Axis Bank'],
];
const isoDay=(year:number,monthIndex:number,day:number)=>new Date(Date.UTC(year,monthIndex,day)).toISOString().slice(0,10);

function sampleRows():DevRow[] {
 const today=todayIST(), [year,month,day]=today.split('-').map(Number);
 const row=(kind:Kind,date:string,rupees:number,description:string,fields:Partial<Entry>={},time='12:00:00'):DevRow=>
  ({id:randomUUID(),kind,date,amount_paise:rupees*100,description,category:null,bank:null,to_bank:null,source:'app',created_at:`${date}T${time}.000Z`,...fields});
 const months=Array.from({length:6},(_,back)=>[
  ...SAMPLE_EXPENSES.map(([d,description,category,rupees,bank])=>
   row('expense',isoDay(year,month-1-back,d),rupees+(category==='Subscriptions'||category==='Bills'||category==='Housing'?0:((d*(back+1))%7)*10),description,{category,bank})),
  row('income',isoDay(year,month-1-back,1),160000,'Salary',{bank:'Kotak Bank'}),
  row('investment',isoDay(year,month-1-back,5),20000,'SIP 1',{bank:'Axis Bank'}),
  row('investment',isoDay(year,month-1-back,5),10000,'SIP 2',{bank:'Axis Bank'}),
  row('savings',isoDay(year,month-1-back,7),30000,'Savings transfer',{bank:'Axis Bank',to_bank:'Kotak Bank'}),
 ]).flat();
 const reported=isoDay(year,month-1,day-10);
 const balances=[['Kotak Bank',85000],['Axis Bank',40000],['HDFC Bank',25000]].map(([bank,rupees])=>
  row('balance',reported,rupees as number,'Balance',{bank:bank as string},'23:00:00'));
 return [...months,...balances].filter(r=>r.date<=today);
}

async function readDev():Promise<DevRow[]> {
 try {
  const rows=JSON.parse(await readFile(DEV_FILE,'utf8'));
  if (rows.every((r:DevRow)=>r.kind)) return rows;
 } catch {}
 const seeded=sampleRows(); await writeDev(seeded); return seeded;
}
const writeDev=(rows:DevRow[])=>writeFile(DEV_FILE,JSON.stringify(rows,null,1));

const fileStore:Store = {
 async list() {
  return (await readDev()).sort((a,b)=>b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
 },
 async create(entry) {
  const rows=await readDev(), created={...entry,id:randomUUID(),source:'app',created_at:new Date().toISOString()};
  await writeDev([...rows,created]);
  return created;
 },
 async update(id,entry) {
  const rows=await readDev(), row=rows.find(r=>r.id===id && r.kind===entry.kind);
  if (!row) throw new Error('Could not be updated.');
  Object.assign(row,entry); await writeDev(rows);
  return row;
 },
 async remove(id) {
  const rows=await readDev(), kept=rows.filter(r=>r.id!==id);
  if (kept.length===rows.length) throw new Error('Could not be deleted.');
  await writeDev(kept);
 },
 async saveFromMessage(messageId,entries) {
  const rows=await readDev();
  const saved=rows.filter(r=>r.source_message_id===messageId).sort((a,b)=>a.source_line!-b.source_line!);
  if (saved.length) return alreadySaved(saved,entries);
  const now=new Date().toISOString();
  const created=entries.map((entry,i)=>({...entry,id:randomUUID(),source:'whatsapp',created_at:now,source_message_id:messageId,source_line:i+1}));
  await writeDev([...rows,...created]);
  return {status:'saved',entries:created};
 },
};
