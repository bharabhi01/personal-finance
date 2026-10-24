import {test} from 'node:test';import assert from 'node:assert/strict';import {validateEntry,validateInstinctBatch,sameEntries} from '../lib/validation.mjs';
const valid={amount_paise:18000,date:'2026-10-13',description:'Dosa',category:'Food',bank:null};
test('Valid integer-paise expense',()=>assert.deepEqual(validateEntry({...valid,bank:undefined}),valid));
test('Reject invalid amounts',()=>{for(const amount_paise of [0,-1,1.5,NaN,100000001,'180'])assert.throws(()=>validateEntry({...valid,amount_paise}));});
test('Reject impossible dates',()=>{for(const date of ['2026-02-30','2026-13-01','yesterday','2026-1-1'])assert.throws(()=>validateEntry({...valid,date}));});
test('Trim text, accept Subscriptions, reject unknown category',()=>{
 assert.equal(validateEntry({...valid,description:' Dosa '}).description,'Dosa');
 assert.equal(validateEntry({...valid,category:'Subscriptions',bank:' Kotak Bank '}).bank,'Kotak Bank');
 assert.equal(validateEntry({...valid,bank:'  '}).bank,null);
 assert.throws(()=>validateEntry({...valid,category:'Unknown'}),/Subscriptions/);assert.throws(()=>validateEntry({...valid,description:''}));assert.throws(()=>validateEntry({...valid,bank:'x'.repeat(101)}));});
test('Instinct message: "Claude Subscription Rs 2300 Kotak Bank"',()=>{
 const batch=validateInstinctBatch({message_id:'wamid.1',expenses:[{amount:2300,description:'Claude Subscription',category:'Subscriptions',bank:'Kotak Bank'}]},'2026-10-24');
 assert.deepEqual(batch,{message_id:'wamid.1',entries:[{amount_paise:230000,date:'2026-10-24',description:'Claude Subscription',category:'Subscriptions',bank:'Kotak Bank'}]});
});
test('Instinct amounts: decimals and numeric strings convert exactly; bad amounts name the expense',()=>{
 const one=(amount,extra={})=>validateInstinctBatch({message_id:'m',expenses:[{amount,description:'x',category:'Food',...extra}]},'2026-10-24').entries[0].amount_paise;
 assert.equal(one(180.5),18050);assert.equal(one('250'),25000);assert.equal(one(0.07),7);assert.equal(one(19.99),1999);
 for(const bad of [0,-5,1.234,'abc',null,undefined,'1e3'])assert.throws(()=>one(bad),/Expense 1:/);
 assert.equal(validateInstinctBatch({message_id:'m',expenses:[{amount:5,description:'x',category:'Food',date:'2026-10-01'}]},'2026-10-24').entries[0].date,'2026-10-01');
});
test('Instinct batch needs a message ID and 1 to 50 expenses',()=>{
 const item={amount:1,description:'x',category:'Food'};
 for(const input of [null,{expenses:[item]},{message_id:'',expenses:[item]},{message_id:'m',expenses:[]},{message_id:'m',expenses:Array(51).fill(item)},{message_id:'m',expenses:[item,{...item,category:'Nope'}]}])assert.throws(()=>validateInstinctBatch(input,'2026-10-24'));
});
test('Retries match only when every field is identical',()=>{
 const saved=[{...valid,bank:null},{...valid,description:'Cab',bank:'UPI'}];
 assert.ok(sameEntries(saved,[valid,{...valid,description:'Cab',bank:'UPI'}]));
 assert.ok(!sameEntries(saved,[valid]));assert.ok(!sameEntries(saved,[valid,{...valid,description:'Cab',bank:'UPI',amount_paise:1}]));assert.ok(!sameEntries(saved,[valid,{...valid,description:'Cab',bank:null}]));
});
