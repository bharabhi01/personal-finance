import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export const configured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
export async function db() {
 if (!configured()) throw new Error('Database setup is pending.');
 const jar=await cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!, {cookies:{getAll:()=>jar.getAll(),setAll:(values)=>{try{values.forEach(({name,value,options})=>jar.set(name,value,options));}catch{}}}});
}
export function checkOrigin(request: Request) {
 const origin=request.headers.get('origin');
 if (!origin || origin!==new URL(request.url).origin) throw new Error('Request origin rejected.');
}
