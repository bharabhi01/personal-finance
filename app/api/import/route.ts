import {db,checkOrigin} from '@/lib/server';
import {validateBatch} from '@/lib/validation.mjs';
export async function POST(req:Request){
 try{checkOrigin(req);const input=validateBatch(await req.json());const client=await db(); const {data:{user}}=await client.auth.getUser();if(!user)return Response.json({error:'Sign in first.'},{status:401});
 const {data,error}=await client.rpc('import_expenses',{message_id:input.source_message_id,items:input.entries});
 if(error)return Response.json({error:'Import rejected. Nothing is confirmed saved.'},{status:400});return Response.json({result:data});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid import.'},{status:400});}
}
