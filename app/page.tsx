import {db,configured} from '@/lib/server';
import {redirect} from 'next/navigation';
import Dashboard from '@/components/Dashboard';
export const dynamic='force-dynamic';
export default async function Page(){
 if(!configured())return <main className="setup"><p className="eyebrow">Expense tracker</p><h1>Ready for setup.</h1><p>The app source is prepared. Hosting, authentication and the database are not connected yet.</p><a className="button" href="/concept">Explore the UI concept</a><p className="muted">The concept uses sample data. No real expenses are saved.</p></main>;
 const client=await db();const {data:{user}}=await client.auth.getUser();if(!user)redirect('/login');
 const {data:access}=await client.from('allowed_users').select('user_id').eq('user_id',user.id).maybeSingle();
 if(!access)return <main className="setup"><h1>Private account only.</h1><p>This account has not been enabled for this expense tracker.</p><a href="/login">Return to sign in</a></main>;
 const entries=[];let failed=false;let total:number|null=null;
 for(let offset=0;;offset+=1000){const {data,error,count}=await client.from('expenses').select('*',{count:'exact'}).order('date',{ascending:false}).order('id').range(offset,offset+999);if(error||!data){failed=true;break;}if(total===null)total=count;if(count!==total){failed=true;break;}entries.push(...data);if(entries.length===(total??entries.length))break;if(data.length===0){failed=true;break;}}
 return <Dashboard initial={failed?[]:entries} demo={false} loadError={failed?'The full ledger could not be loaded. No partial totals are shown. Please refresh.':undefined}/>;
}
