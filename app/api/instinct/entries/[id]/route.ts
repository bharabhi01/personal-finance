import {instinctAuthorized,validId} from '@/lib/server';
import {getOwnerStore} from '@/lib/store';
import {instinctView,validateInstinctChange} from '@/lib/validation.mjs';

type Context={params:Promise<{id:string}>};
const fail=(e:unknown)=>Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});
async function target(req:Request,{params}:Context){
 if (!instinctAuthorized(req)) return {denied:Response.json({error:'Invalid or missing API key.'},{status:401})};
 const {id}=await params;
 if (!validId(id)) throw new Error('Invalid ID.');
 return {id,store:getOwnerStore()};
}

/** Changes only the fields sent (amount in rupees, description, category, bank / from_bank, to_bank, date). */
export async function PATCH(req:Request,context:Context){
 try{
  const t=await target(req,context); if (t.denied) return t.denied;
  const current=await t.store.get(t.id);
  const updated=await t.store.update(t.id,validateInstinctChange(current,await req.json()));
  return Response.json({status:'updated',entry:instinctView(updated)});
 }catch(e){return fail(e);}
}

export async function DELETE(req:Request,context:Context){
 try{
  const t=await target(req,context); if (t.denied) return t.denied;
  const entry=await t.store.get(t.id);
  await t.store.remove(t.id);
  return Response.json({status:'deleted',entry:instinctView(entry)});
 }catch(e){return fail(e);}
}
