import {checkOrigin} from '@/lib/server';
import {getStore} from '@/lib/store';
import {validateSchedule} from '@/lib/validation.mjs';
/** Changes how often a subscription is billed and/or whether it is active, paused or cancelled. */
export async function PUT(req:Request){
 try{checkOrigin(req); const {name,...change}=validateSchedule(await req.json()); const store=await getStore(); if(!store)return Response.json({error:'Sign in first.'},{status:401});
 return Response.json({name,...await store.setSchedule(name,change)});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});}
}
