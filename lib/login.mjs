export function loginIdentity(value,alias={}){
 if(typeof value!=='string'||value.length>254)throw Error('Invalid login.');
 const input=value.trim().toLowerCase();
 if(alias.username&&input===alias.username.toLowerCase()){
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alias.email??'')||!/^[0-9a-f-]{36}$/i.test(alias.userId??''))throw Error('Invalid login.');
  return {email:alias.email,expectedId:alias.userId};
 }
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input))throw Error('Invalid login.');
 return {email:input,expectedId:null};
}
