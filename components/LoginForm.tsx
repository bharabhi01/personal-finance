'use client';
import {useState} from 'react';
export default function LoginForm(){const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=new FormData(e.currentTarget);
 try{const res=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:String(form.get('email')),password:String(form.get('password'))})});if(!res.ok)throw Error('Sign-in failed. Check your details.');window.location.assign('/');}
 catch{setError('Sign-in failed. Check your details.');setBusy(false);}}
 return <main className="setup"><p className="eyebrow">Your private ledger</p><h1>Welcome back.</h1><p>Your expenses stay behind your sign-in.</p><form onSubmit={submit}><label>Email<input type="email" name="email" autoComplete="username" required/></label><label>Password<input type="password" name="password" autoComplete="current-password" required/></label><button disabled={busy} className="button">{busy?'Signing in...':'Sign in'}</button><p role="alert">{error}</p></form></main>}
