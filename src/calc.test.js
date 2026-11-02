import {test} from 'node:test';import assert from 'node:assert/strict';import {calculate,deduct} from './calc.js';
const f=[{id:'a',name:'Apple',amount:10,pg:100}];const base={name:'Test',volume:100,vg:70,nicotine:3,strength:18,nicPg:100,ingredients:[{flavourId:'a',percent:5}]};
test('conserves total volume and accounts for PG nicotine',()=>{const r=calculate(base,f);assert.deepEqual(r.errors,[]);assert.equal(r.nic,16.666667);assert.equal(r.pg,8.333333);assert.equal(r.vg,70);assert.equal(r.rows[0].ml+r.nic+r.pg+r.vg,100);});
test('aggregates repeated ingredients before stock check',()=>{const r=calculate({...base,ingredients:[{flavourId:'a',percent:6},{flavourId:'a',percent:6}]},f);assert.equal(r.rows.length,1);assert.equal(r.shortages.length,1);assert.throws(()=>deduct(f,r));});
test('deducts without mutating original stock',()=>{const r=calculate(base,f);assert.equal(deduct(f,r)[0].amount,5);assert.equal(f[0].amount,10);});
test('blocks impossible ratio',()=>assert.ok(calculate({...base,vg:95},f).errors.length));
test('blocks invalid, missing and negative input',()=>{for(const change of [{volume:0},{volume:NaN},{nicotine:-1},{strength:0},{vg:101},{ingredients:[{flavourId:'missing',percent:2}]},{ingredients:[{flavourId:'a',percent:-2}]}])assert.ok(calculate({...base,...change},f).errors.length);});
test('handles VG flavour and VG nicotine carriers',()=>{const r=calculate({...base,nicPg:0},[{...f[0],pg:0}]);assert.equal(r.pg,30);assert.equal(r.vg,48.333333);});
test('allows exact stock exhaustion',()=>{const r=calculate({...base,nicotine:0,ingredients:[{flavourId:'a',percent:10}]},f);assert.equal(deduct(f,r)[0].amount,0);});
