import {test} from 'node:test';import assert from 'node:assert/strict';
import {periodRange,monthOptions,latestMonth,filterRows,summarize,categoryTotals,dailySeries,subscriptions,addMonth,moneyFlow,accountBalances} from '../lib/summary.ts';
const today='2026-10-24';
const row=(date,amount_paise,category='Food',description='x',bank=null)=>({date,amount_paise,category,description,bank});
test('Period ranges: month, last N calendar months, all time',()=>{
 assert.deepEqual(periodRange('2026-02',today),{from:'2026-02-01',to:'2026-02-28'});
 assert.deepEqual(periodRange('2028-02',today),{from:'2028-02-01',to:'2028-02-29'});
 assert.deepEqual(periodRange('last-3',today),{from:'2026-08-01',to:null});
 assert.deepEqual(periodRange('last-12',today),{from:'2025-11-01',to:null});
 assert.deepEqual(periodRange('last-6','2026-02-10'),{from:'2025-09-01',to:null});
 assert.deepEqual(periodRange('all',today),{from:null,to:null});
});
test('Month options run newest first across the year boundary',()=>{
 const months=monthOptions('2026-02-10',4);
 assert.deepEqual(months.map(m=>m.value),['2026-02','2026-01','2025-12','2025-11']);assert.equal(months[0].label,'February 2026');
});
test('The default month follows the newest entry, even past today, and falls back to today',()=>{
 assert.equal(latestMonth([row('2026-09-30',1),row('2026-11-02',2),row('2026-10-05',3)],today),'2026-11');
 assert.equal(latestMonth([],today),'2026-10');
 assert.equal(monthOptions('2026-11-02',2)[0].value,'2026-11');
});
test('Filtering is inclusive on dates and by category',()=>{
 const rows=[row('2026-09-30',1),row('2026-10-01',2),row('2026-10-31',4,'Bills'),row('2026-11-01',8)];
 const october=periodRange('2026-10',today);
 assert.deepEqual(filterRows(rows,october,'All').map(r=>r.amount_paise),[2,4]);
 assert.deepEqual(filterRows(rows,october,'Bills').map(r=>r.amount_paise),[4]);
 assert.equal(filterRows(rows,periodRange('all',today),'All').length,4);
});
test('Summary: total, count, average, top category',()=>{
 const rows=[row('2026-10-01',100,'Food'),row('2026-10-02',300,'Travel'),row('2026-10-03',200,'Travel')];
 const s=summarize(rows);
 assert.equal(s.total,600);assert.equal(s.count,3);assert.equal(s.average,200);assert.deepEqual(s.top,{name:'Travel',value:500,share:500/600});
 assert.deepEqual(summarize([]),{total:0,count:0,average:0,top:null});
 assert.deepEqual(categoryTotals(rows).map(c=>c.name),['Travel','Food']);
});
test('Daily series covers every day and sums same-day expenses',()=>{
 const rows=[row('2026-10-02',100),row('2026-10-02',50),row('2026-10-04',70)];
 const {points,clipped}=dailySeries(rows,periodRange('2026-10',today),today);
 assert.equal(points.length,31);assert.equal(clipped,false);
 assert.deepEqual(points.slice(0,4),[{date:'2026-10-01',value:0},{date:'2026-10-02',value:150},{date:'2026-10-03',value:0},{date:'2026-10-04',value:70}]);
 const last3=dailySeries(rows,periodRange('last-3',today),today).points;
 assert.equal(last3[0].date,'2026-08-01');assert.equal(last3.at(-1).date,today);
 const all=dailySeries([row('2020-01-01',5)],periodRange('all',today),today);
 assert.equal(all.points.length,366);assert.equal(all.clipped,true);assert.equal(all.points.at(-1).date,today);
});
test('Subscriptions: latest charge per name, next due a month later',()=>{
 const rows=[row('2026-08-03',210000,'Subscriptions','Claude Subscription','Kotak Bank'),row('2026-10-03',230000,'Subscriptions',' claude subscription','Kotak Bank'),row('2026-10-08',64900,'Subscriptions','Netflix'),row('2026-10-09',500,'Food','Chai')];
 const subs=subscriptions(rows);
 assert.deepEqual(subs.map(s=>[s.name.trim(),s.amount_paise,s.next]),[['claude subscription',230000,'2026-11-03'],['Netflix',64900,'2026-11-08']]);
 assert.equal(addMonth('2026-01-31'),'2026-02-28');assert.equal(addMonth('2026-12-15'),'2027-01-15');
});

const led=(kind,date,rupees,bank=null,to_bank=null,created_at=date+'T12:00:00.000Z',description='x')=>({kind,date,amount_paise:rupees*100,category:null,description,bank,to_bank,created_at});
test('Money flow: shares are fractions of income, with the remainder unallocated',()=>{
 const f=moneyFlow([led('income','2026-10-01',100000),led('expense','2026-10-02',25000),led('investment','2026-10-05',20000),led('savings','2026-10-07',30000,'Axis Bank','Kotak Bank'),led('balance','2026-10-08',999)]);
 assert.deepEqual([f.income,f.expenses,f.investments,f.savings,f.left],[10000000,2500000,2000000,3000000,2500000]);
 assert.deepEqual(f.shares,{expenses:0.25,investments:0.2,savings:0.3});
 const none=moneyFlow([led('expense','2026-10-02',500)]);assert.equal(none.shares.expenses,null);assert.equal(none.left,-50000);
});
test('Balances: reported balance, then later entries move it; savings accounts follow transfers in',()=>{
 const rows=[
  led('balance','2026-10-10',85000,'Kotak Bank',null,'2026-10-10T20:00:00.000Z'),
  led('balance','2026-10-10',40000,'Axis Bank',null,'2026-10-10T20:00:01.000Z'),
  led('savings','2026-10-12',30000,'Axis Bank','kotak bank','2026-10-12T09:00:00.000Z'),
  led('expense','2026-10-13',2300,'Kotak Bank',null,'2026-10-13T09:00:00.000Z'),
  led('income','2026-10-14',5000,'Axis Bank',null,'2026-10-14T09:00:00.000Z'),
  led('investment','2026-10-15',10000,'Axis Bank',null,'2026-10-15T09:00:00.000Z'),
 ];
 const b=accountBalances(rows);
 assert.deepEqual(b.accounts.map(a=>[a.name,a.balance,a.savings]),[['Kotak Bank',85000*100+30000*100-2300*100,true],['Axis Bank',(40000-30000+5000-10000)*100,false]]);
 assert.equal(b.savingsTotal,112700*100);assert.equal(b.total,(112700+5000)*100);assert.equal(b.savingsUnknown,0);
});
test('Balances: older, same-day-earlier and backdated entries are already in the reported figure; the newest report wins',()=>{
 const rows=[
  led('expense','2026-10-09',1000,'Kotak Bank',null,'2026-10-09T09:00:00.000Z'),
  led('expense','2026-10-10',500,'Kotak Bank',null,'2026-10-10T08:00:00.000Z'),
  led('balance','2026-10-10',50000,'Kotak Bank',null,'2026-10-10T20:00:00.000Z'),
  led('expense','2026-10-08',700,'Kotak Bank',null,'2026-10-11T09:00:00.000Z'),
  led('expense','2026-10-10',300,'Kotak Bank',null,'2026-10-10T21:00:00.000Z'),
 ];
 assert.equal(accountBalances(rows).accounts[0].balance,(50000-300)*100);
 const newer=[...rows,led('balance','2026-10-12',40000,'KOTAK BANK',null,'2026-10-12T10:00:00.000Z')];
 assert.deepEqual(accountBalances(newer).accounts.map(a=>[a.name,a.balance]),[['KOTAK BANK',4000000]]);
});
test('Balances: banks without a reported balance show null and are left out of totals',()=>{
 const b=accountBalances([led('expense','2026-10-02',100,'HDFC Bank'),led('savings','2026-10-03',500,'HDFC Bank','Kotak Bank')]);
 assert.deepEqual(b.accounts.map(a=>[a.name,a.balance,a.savings]),[['Kotak Bank',null,true],['HDFC Bank',null,false]]);
 assert.deepEqual([b.total,b.savingsTotal,b.savingsUnknown],[0,0,1]);assert.deepEqual(accountBalances([]).accounts,[]);
});
