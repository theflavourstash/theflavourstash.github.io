import {test} from 'node:test';
import assert from 'node:assert/strict';
import {availability,sortRecipes} from './availability.js';
const recipe={volume:100,vg:50,nicotine:0,strength:72,nicPg:100,ingredients:[{flavourId:'a',percent:2},{flavourId:'b',percent:1}]};
const stock=(a,b)=>[{id:'a',name:'A',amount:a,pg:100},{id:'b',name:'B',amount:b,pg:100}];
test('availability separates ownership from sufficient quantities',()=>{
 const a=availability(recipe,stock(.5,1));
 assert.equal(a.percent,100);assert.equal(a.canMake,false);assert.equal(a.maxBatch,25);assert.equal(a.short[0].shortBy,1.5);
 assert.equal(availability(recipe,stock(2,1)).canMake,true);
 assert.equal(availability(recipe,stock(0,0)).percent,0);
 assert.equal(availability(recipe,stock(2,0)).percent,50);
});
test('missing references, duplicate lines and empty recipes cannot inflate coverage',()=>{
 assert.equal(availability(recipe,[]).missing.length,2);
 const a=availability({...recipe,ingredients:[...recipe.ingredients,{flavourId:'a',percent:2}]},stock(2,1));
 assert.equal(a.total,2);assert.equal(a.short[0].shortBy,2);
 assert.equal(availability({...recipe,ingredients:[]},[]).canMake,false);
});
test('dates sort in both directions with unknown dates last',()=>{
 const r=[{name:'Unknown'}, {name:'Old',createdAt:'2018-07-02T18:52'}, {name:'New',createdAt:'2026-03-04T18:04'}];
 assert.deepEqual(sortRecipes(r,'newest',[]).map(r=>r.name),['New','Old','Unknown']);
 assert.deepEqual(sortRecipes(r,'oldest',[]).map(r=>r.name),['Old','New','Unknown']);
});
