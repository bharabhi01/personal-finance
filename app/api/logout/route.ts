import {db,checkOrigin} from '@/lib/server';
export async function POST(req:Request){try{checkOrigin(req);const client=await db();const {error}=await client.auth.signOut();if(error)return Response.json({error:'Sign-out failed.'},{status:400});return Response.json({signed_out:true});}catch(e){return Response.json({error:e instanceof Error?e.message:'Sign-out failed.'},{status:400});}}
