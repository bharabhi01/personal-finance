import {test} from 'node:test';import assert from 'node:assert/strict';import {validateEntry,validateBatch} from '../lib/validation.mjs';
const valid={amount_paise:18000,date:'2026-10-13',description:'Dosa',category:'Food'};
test('Valid integer-paise expense',()=>assert.deepEqual(validateEntry(valid),valid));
test('Reject invalid amounts',()=>{for(const amount_paise of [0,-1,1.5,NaN,100000001,'180'])assert.throws(()=>validateEntry({...valid,amount_paise}));});
test('Reject impossible dates',()=>{for(const date of ['2026-02-30','2026-13-01','yesterday','2026-1-1'])assert.throws(()=>validateEntry({...valid,date}));});
test('Trim descriptions and reject unknown category',()=>{assert.equal(validateEntry({...valid,description:' Dosa '}).description,'Dosa');assert.throws(()=>validateEntry({...valid,category:'Unknown'}));assert.throws(()=>validateEntry({...valid,description:''}));});
test('Batch requires message ID and valid rows',()=>{assert.equal(validateBatch({source_message_id:'msg-1',entries:[valid]}).entries.length,1);for(const input of [{entries:[valid]},{source_message_id:'x',entries:[]},{source_message_id:'x',entries:[{...valid,amount_paise:0}]}])assert.throws(()=>validateBatch(input));});
