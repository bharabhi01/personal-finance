import {db,checkOrigin} from '@/lib/server';
export async function POST(req:Request){
 try{
  checkOrigin(req);
  const {email,password}=await req.json();
  if(typeof email!=='string'||typeof password!=='string'||!email||!password)throw Error('Invalid login.');
  const client=await db();
  const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
  if(error)return Response.json({error:'Sign-in failed. Check your details.'},{status:401});
  return Response.json({signed_in:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Sign-in failed. Check your details.'},{status:400});}
}
