import {db,checkOrigin} from '@/lib/server';
import {loginIdentity} from '@/lib/login.mjs';
export async function POST(req:Request){
 try{
  checkOrigin(req);
  const {identifier,password}=await req.json();
  if(typeof password!=='string'||!password||password.length>4096)throw Error('Invalid login.');
  const identity=loginIdentity(identifier,{username:process.env.LOGIN_ALIAS_USERNAME,email:process.env.LOGIN_ALIAS_EMAIL,userId:process.env.LOGIN_ALIAS_USER_ID}),client=await db();
  const {data,error}=await client.auth.signInWithPassword({email:identity.email,password});
  if(error||!data.user)return Response.json({error:'Sign-in failed. Check your details.'},{status:401});
  const {data:access}=await client.from('allowed_users').select('user_id').eq('user_id',data.user.id).maybeSingle();
  if((identity.expectedId&&data.user.id!==identity.expectedId)||!access){await client.auth.signOut();return Response.json({error:'Sign-in failed. Check your details.'},{status:401});}
  return Response.json({signed_in:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Sign-in failed. Check your details.'},{status:400});}
}
