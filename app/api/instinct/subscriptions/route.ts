import {instinctAuthorized} from '@/lib/server';
import {getOwnerStore} from '@/lib/store';
import {validateFrequency} from '@/lib/validation.mjs';

/** Sets how often a subscription is billed: {name (its description), frequency}. */
export async function PUT(req:Request){
 if (!instinctAuthorized(req)) return Response.json({error:'Invalid or missing API key.'},{status:401});
 try{
  const {name,frequency}=validateFrequency(await req.json());
  await getOwnerStore().setFrequency(name,frequency);
  return Response.json({status:'updated',name,frequency});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});}
}
