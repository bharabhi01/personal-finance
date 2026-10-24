import {redirect} from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import {isDev} from '@/lib/server';
import {getStore,type Transaction} from '@/lib/store';
export const dynamic='force-dynamic';
export default async function Page(){
 const store=await getStore();
 if(!store)redirect('/login');
 let entries:Transaction[]=[],loadError:string|undefined;
 try{entries=await store.list();}catch(e){loadError=e instanceof Error?e.message:'The ledger could not be loaded.';}
 return <Dashboard initial={entries} loadError={loadError} canSignOut={!isDev}/>;
}
