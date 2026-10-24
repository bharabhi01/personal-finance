import {test} from 'node:test';import assert from 'node:assert/strict';
import {periodRange,monthOptions,filterRows,summarize,categoryTotals,dailySeries,subscriptions,addMonth} from '../lib/summary.ts';
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
