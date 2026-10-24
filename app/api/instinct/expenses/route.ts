import {createHash,timingSafeEqual} from 'node:crypto';
import {isDev} from '@/lib/server';
import {getOwnerStore} from '@/lib/store';
import {todayIST} from '@/lib/format';
import {validateInstinctBatch} from '@/lib/validation.mjs';

const digest=(value:string)=>createHash('sha256').update(value).digest();
function authorized(req:Request) {
 const key=process.env.INSTINCT_API_KEY;
 if (!key) return false;
 return timingSafeEqual(digest(key),digest((req.headers.get('authorization') ?? '').replace(/^Bearer /,'')));
}

export async function POST(req:Request){
 if (!isDev && !authorized(req)) return Response.json({error:'Invalid or missing API key.'},{status:401});
 try{
  const input=validateInstinctBatch(await req.json(),todayIST());
  const result=await getOwnerStore().saveFromMessage(input.message_id,input.entries);
  return Response.json(result,{status:result.status==='saved'?201:200});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});}
}
