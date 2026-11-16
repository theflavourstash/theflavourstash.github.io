import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculate} from './calc.js';
const recipes=JSON.parse(readFileSync(new URL('./elr-calculator-fixtures.json',import.meta.url)));
// ELR screenshots display ml to two decimal places. Compare within half a display unit.
const same=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<=.005001,`${label}: ${actual} vs ${expected}`);
for(const r of recipes)test(`ELR screenshot: ${r.name}`,()=>{
 const flavours=r.ingredients.map(i=>({id:i.flavourId,name:i.flavourId,pg:100,amount:1000}));
 const result=calculate(r,flavours);
 assert.deepEqual(result.errors,[]);
 for(const key of ['nic','pg','vg'])same(result[key],r.expected[key],key);
 result.rows.forEach((row,i)=>same(row.ml,r.expected.flavours[i],`flavour ${i+1}`));
 same(result.rows.reduce((sum,row)=>sum+row.ml,0)+result.nic+result.pg+result.vg,r.volume,'total volume');
});
