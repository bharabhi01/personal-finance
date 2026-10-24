import {checkOrigin} from '@/lib/server';
import {getStore} from '@/lib/store';
import {validateEntry} from '@/lib/validation.mjs';
export async function POST(req:Request){
 try{checkOrigin(req); const input=validateEntry(await req.json()); const store=await getStore(); if(!store)return Response.json({error:'Sign in first.'},{status:401});
 return Response.json({transaction:await store.create(input)},{status:201});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});}
}
