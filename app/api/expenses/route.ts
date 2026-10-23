import {db,checkOrigin} from '@/lib/server';
import {validateEntry} from '@/lib/validation.mjs';
export async function POST(req:Request){
 try{checkOrigin(req); const input=validateEntry(await req.json()); const client=await db(); const {data:{user}}=await client.auth.getUser(); if(!user)return Response.json({error:'Sign in first.'},{status:401});
 const {data,error}=await client.from('expenses').insert({...input,user_id:user.id,source:'app'}).select().single();
 if(error)return Response.json({error:'Expense could not be saved. No success confirmed.'},{status:400}); return Response.json({expense:data},{status:201});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});}
}
