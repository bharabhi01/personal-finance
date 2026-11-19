import {checkOrigin} from '@/lib/server';
import {getStore} from '@/lib/store';
import {validateFrequency} from '@/lib/validation.mjs';
/** Sets how often a subscription is billed. */
export async function PUT(req:Request){
 try{checkOrigin(req); const {name,frequency}=validateFrequency(await req.json()); const store=await getStore(); if(!store)return Response.json({error:'Sign in first.'},{status:401});
 await store.setFrequency(name,frequency); return Response.json({name,frequency});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});}
}
