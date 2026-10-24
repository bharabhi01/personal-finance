import {test} from 'node:test';import assert from 'node:assert/strict';import {validateEntry,validateInstinctBatch,sameEntries} from '../lib/validation.mjs';
const expense={amount_paise:18000,date:'2026-10-13',description:'Dosa',category:'Food'};
const full=(over={})=>({kind:'expense',to_bank:null,bank:null,...expense,...over});
test('Valid integer-paise expense (kind defaults to expense)',()=>assert.deepEqual(validateEntry(expense),full()));
test('Reject invalid amounts',()=>{for(const amount_paise of [0,-1,1.5,NaN,100000001,'180'])assert.throws(()=>validateEntry({...expense,amount_paise}));});
test('Reject impossible dates',()=>{for(const date of ['2026-02-30','2026-13-01','yesterday','2026-1-1'])assert.throws(()=>validateEntry({...expense,date}));});
test('Trim text, accept Subscriptions, reject unknown category or kind',()=>{
 assert.equal(validateEntry({...expense,description:' Dosa '}).description,'Dosa');
 assert.equal(validateEntry({...expense,category:'Subscriptions',bank:' Kotak Bank '}).bank,'Kotak Bank');
 assert.equal(validateEntry({...expense,bank:'  '}).bank,null);
 assert.throws(()=>validateEntry({...expense,category:'Unknown'}),/Subscriptions/);assert.throws(()=>validateEntry({...expense,category:undefined}));
 assert.throws(()=>validateEntry({...expense,description:''}));assert.throws(()=>validateEntry({...expense,bank:'x'.repeat(101)}));assert.throws(()=>validateEntry({...expense,kind:'gift'}),/Kind must be/);});
test('Income and investments need a description, no category, and allow big amounts',()=>{
 assert.deepEqual(validateEntry({kind:'income',amount_paise:15000000,date:'2026-10-01',description:'Salary',bank:'Kotak Bank',category:'Food'}),{kind:'income',amount_paise:15000000,date:'2026-10-01',description:'Salary',category:null,bank:'Kotak Bank',to_bank:null});
 assert.equal(validateEntry({kind:'investment',amount_paise:5000000000,date:'2026-10-01',description:'SIP 1'}).bank,null);
 assert.throws(()=>validateEntry({kind:'investment',amount_paise:100,date:'2026-10-01'}));assert.throws(()=>validateEntry({...expense,amount_paise:100000001}));
});
test('Savings move between two different banks; balances need a bank and may be zero',()=>{
 const savings={kind:'savings',amount_paise:3000000,date:'2026-10-07',bank:'Axis Bank',to_bank:'Kotak Bank'};
 assert.deepEqual(validateEntry(savings),{...savings,description:'Savings transfer',category:null});
 for(const bad of [{to_bank:null},{bank:null},{to_bank:' axis bank '}])assert.throws(()=>validateEntry({...savings,...bad}));
 assert.equal(validateEntry({kind:'balance',amount_paise:0,date:'2026-10-07',bank:'Kotak Bank'}).description,'Balance');
 assert.throws(()=>validateEntry({kind:'balance',amount_paise:100,date:'2026-10-07'}));assert.throws(()=>validateEntry({kind:'balance',amount_paise:-1,date:'2026-10-07',bank:'x'}));
});
test('Instinct message: "Claude Subscription Rs 2300 Kotak Bank"',()=>{
 const batch=validateInstinctBatch({message_id:'wamid.1',expenses:[{amount:2300,description:'Claude Subscription',category:'Subscriptions',bank:'Kotak Bank'}]},'2026-10-24');
 assert.deepEqual(batch,{message_id:'wamid.1',entries:[{kind:'expense',amount_paise:230000,date:'2026-10-24',description:'Claude Subscription',category:'Subscriptions',bank:'Kotak Bank',to_bank:null}]});
});
test('Instinct mixed message keeps list order: expenses, income, investments, savings, balances',()=>{
 const {entries}=validateInstinctBatch({message_id:'m',balances:[{bank:'Kotak Bank',amount:85000}],savings:[{amount:30000,from_bank:'Axis Bank',to_bank:'Kotak Bank'}],investments:[{amount:20000,description:'SIP 1'}],income:[{amount:150000,description:'Salary',bank:'Kotak Bank'}],expenses:[{amount:180,description:'Dosa',category:'Food'}]},'2026-10-24');
 assert.deepEqual(entries.map(e=>[e.kind,e.amount_paise,e.bank,e.to_bank]),[['expense',18000,null,null],['income',15000000,'Kotak Bank',null],['investment',2000000,null,null],['savings',3000000,'Axis Bank','Kotak Bank'],['balance',8500000,'Kotak Bank',null]]);
});
test('Instinct amounts: decimals and numeric strings convert exactly; errors name the list and position',()=>{
 const one=(amount)=>validateInstinctBatch({message_id:'m',expenses:[{amount,description:'x',category:'Food'}]},'2026-10-24').entries[0].amount_paise;
 assert.equal(one(180.5),18050);assert.equal(one('250'),25000);assert.equal(one(0.07),7);assert.equal(one(19.99),1999);
 for(const bad of [0,-5,1.234,'abc',null,undefined,'1e3'])assert.throws(()=>one(bad),/expenses #1:/);
 assert.throws(()=>validateInstinctBatch({message_id:'m',savings:[{amount:5,from_bank:'A',to_bank:'A'}]},'2026-10-24'),/savings #1: .*different banks/);
 assert.equal(validateInstinctBatch({message_id:'m',expenses:[{amount:5,description:'x',category:'Food',date:'2026-10-01'}]},'2026-10-24').entries[0].date,'2026-10-01');
});
test('Instinct batch needs a message ID, known lists and 1 to 50 entries',()=>{
 const item={amount:1,description:'x',category:'Food'};
 for(const input of [null,[],{expenses:[item]},{message_id:'',expenses:[item]},{message_id:'m'},{message_id:'m',expenses:[]},{message_id:'m',expenses:Array(51).fill(item)},{message_id:'m',expenses:[item,{...item,category:'Nope'}]},{message_id:'m',expense:[item]},{message_id:'m',expenses:'x'}])assert.throws(()=>validateInstinctBatch(input,'2026-10-24'));
});
test('Retries match only when every field is identical',()=>{
 const a=validateEntry(expense),b=validateEntry({...expense,description:'Cab',bank:'UPI'});
 assert.ok(sameEntries([{...a,id:1},{...b,id:2}],[a,b]));
 assert.ok(!sameEntries([a,b],[a]));assert.ok(!sameEntries([a,b],[a,{...b,amount_paise:1}]));assert.ok(!sameEntries([a,b],[a,{...b,bank:null}]));assert.ok(!sameEntries([a],[{...a,kind:'income'}]));
});
