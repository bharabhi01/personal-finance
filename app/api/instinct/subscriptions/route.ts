import {instinctAuthorized} from '@/lib/server';
import {getOwnerStore} from '@/lib/store';
import {subscriptions} from '@/lib/summary';
import {validateSchedule} from '@/lib/validation.mjs';

const unauthorized=()=>Response.json({error:'Invalid or missing API key.'},{status:401});
const fail=(e:unknown)=>Response.json({error:e instanceof Error?e.message:'Invalid request.'},{status:400});

/** Lists recurring payments with their saved schedule, latest charge and next due date (amounts in rupees). */
export async function GET(req:Request){
 if (!instinctAuthorized(req)) return unauthorized();
 try{
  const store=getOwnerStore(), [rows,schedules]=await Promise.all([store.list(),store.schedules()]);
  const items=subscriptions(rows.filter(r=>r.kind==='expense'),schedules).map(s=>({
   name:s.name,category:s.category,amount:s.amount_paise/100,bank:s.bank,frequency:s.frequency,status:s.status,
   last_charged:s.last,next_due:s.status==='active'?s.next:null,
  }));
  return Response.json({subscriptions:items});
 }catch(e){return fail(e);}
}

/** Changes a schedule: {name (the description), frequency and/or status}. Returns the schedule as stored. */
export async function PUT(req:Request){
 if (!instinctAuthorized(req)) return unauthorized();
 try{
  const {name,...change}=validateSchedule(await req.json());
  return Response.json({status:'updated',name,schedule:await getOwnerStore().setSchedule(name,change)});
 }catch(e){return fail(e);}
}
