import {checkOrigin} from '@/lib/server';
import {getStore} from '@/lib/store';
import {validateBatch} from '@/lib/validation.mjs';
export async function POST(req:Request){
 try{checkOrigin(req);const input=validateBatch(await req.json());const store=await getStore();if(!store)return Response.json({error:'Sign in first.'},{status:401});
 return Response.json({result:await store.importBatch(input.source_message_id,input.entries)});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid import.'},{status:400});}
}
