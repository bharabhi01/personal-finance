import {test} from 'node:test';import assert from 'node:assert/strict';import {loginIdentity} from '../lib/login.mjs';
const alias={username:'sampleuser',email:'sample@example.invalid',userId:'00000000-0000-0000-0000-000000000001'};
test('Username resolves only to explicit configured identity',()=>assert.deepEqual(loginIdentity(' SampleUser ',alias),{email:alias.email,expectedId:alias.userId}));
test('Email remains email login without alias',()=>assert.deepEqual(loginIdentity('owner@example.invalid'),{email:'owner@example.invalid',expectedId:null}));
test('Unknown or unconfigured usernames never invent emails',()=>{for(const x of ['admin','',null,'a'.repeat(255),'a b@c.d'])assert.throws(()=>loginIdentity(x,alias));assert.throws(()=>loginIdentity('sampleuser'));assert.throws(()=>loginIdentity('sampleuser',{username:'sampleuser'}));});
