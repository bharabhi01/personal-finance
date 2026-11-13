import {createHash,timingSafeEqual} from 'node:crypto';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

export const isDev = process.env.NODE_ENV === 'development';

export async function db() {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
 const jar=await cookies();
 return createServerClient(url, key, {cookies:{getAll:()=>jar.getAll(),setAll:(values)=>{try{values.forEach(({name,value,options})=>jar.set(name,value,options));}catch{}}}});
}

export function checkOrigin(request: Request) {
 const origin=request.headers.get('origin');
 if (!origin || origin!==new URL(request.url).origin) throw new Error('Request origin rejected.');
}

const digest=(value:string)=>createHash('sha256').update(value).digest();
/** True when the request carries the Instinct API key (development needs none). */
export function instinctAuthorized(request: Request) {
 if (isDev) return true;
 const key=process.env.INSTINCT_API_KEY;
 if (!key) return false;
 return timingSafeEqual(digest(key),digest((request.headers.get('authorization') ?? '').replace(/^Bearer /,'')));
}

export const validId=(id:string)=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
