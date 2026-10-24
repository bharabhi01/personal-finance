import {checkOrigin} from '@/lib/server';
import {getStore} from '@/lib/store';
import {validateEntry} from '@/lib/validation.mjs';
const validId=(id:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){try{checkOrigin(req);const {id}=await params;if(!validId(id))throw new Error('Invalid ID.');const entry=validateEntry(await req.json());const store=await getStore();if(!store)return Response.json({error:'Sign in first.'},{status:401});return Response.json({transaction:await store.update(id,entry)});}catch(e){return Response.json({error:e instanceof Error?e.message:'Update failed.'},{status:400})}}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){try{checkOrigin(req);const {id}=await params;if(!validId(id))throw new Error('Invalid ID.');const store=await getStore();if(!store)return Response.json({error:'Sign in first.'},{status:401});await store.remove(id);return Response.json({deleted_id:id});}catch(e){return Response.json({error:e instanceof Error?e.message:'Delete failed.'},{status:400})}}
