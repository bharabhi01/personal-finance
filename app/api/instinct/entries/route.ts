import {instinctAuthorized} from '@/lib/server';
import {getOwnerStore} from '@/lib/store';
import {todayIST} from '@/lib/format';
import {instinctView,kinds,validateInstinctBatch} from '@/lib/validation.mjs';

const unauthorized=()=>Response.json({error:'Invalid or missing API key.'},{status:401});

export async function POST(req:Request){
 if (!instinctAuthorized(req)) return unauthorized();
 try{
  const input=validateInstinctBatch(await req.json(),todayIST());
  const store=getOwnerStore(), result=await store.saveFromMessage(input.message_id,input.entries);
  for (const {name,frequency} of input.frequencies) await store.setFrequency(name,frequency);
  return Response.json(result,{status:result.status==='saved'?201:200});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});}
}

/** Finds saved entries to edit or delete, newest first. Filters: q (text in the description), kind, date, limit (default 10, at most 50). */
export async function GET(req:Request){
 if (!instinctAuthorized(req)) return unauthorized();
 try{
  const params=new URL(req.url).searchParams, q=params.get('q')?.trim().toLowerCase(), kind=params.get('kind'), date=params.get('date');
  if (kind && !kinds.includes(kind)) throw new Error('kind must be one of: '+kinds.join(', ')+'.');
  const limit=Number(params.get('limit') ?? 10);
  if (!Number.isInteger(limit) || limit<1 || limit>50) throw new Error('limit must be a whole number from 1 to 50.');
  const rows=(await getOwnerStore().list())
   .filter(r=>(!q || r.description.toLowerCase().includes(q)) && (!kind || r.kind===kind) && (!date || r.date===date))
   .sort((a,b)=>b.created_at.localeCompare(a.created_at))
   .slice(0,limit);
  return Response.json({entries:rows.map(instinctView)});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});}
}
