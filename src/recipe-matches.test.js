import {test} from 'node:test';import assert from 'node:assert/strict';
import {recipeSignature,exclusionRecipes,compareRecipes} from './recipe-matches.js';
import {buildPrompt,promptDefaults} from './prompt.js';
const r={name:'Original',volume:100,ingredients:[{flavourId:'a',percent:3},{flavourId:'b',percent:2}]};
test('duplicate detection ignores names, size, line order and split ingredients',()=>{
 const copy={...r,name:'Renamed',volume:500,ingredients:[{flavourId:'b',percent:2},{flavourId:'a',percent:1},{flavourId:'a',percent:2}]};
 assert.equal(recipeSignature(r),recipeSignature(copy));assert.equal(compareRecipes([copy],[r])[0].exact,r);
 assert.equal(compareRecipes([r,copy],[])[1].exact,r);
 assert.equal(compareRecipes([{...r,ingredients:[{flavourId:'other-brand',percent:3},{flavourId:'b',percent:2}]}],[r])[0].exact,undefined);
});
test('near variations are flagged without being removed',()=>{
 const variation={...r,ingredients:[{flavourId:'a',percent:3.5},{flavourId:'b',percent:2}]};
 const match=compareRecipes([variation],[r])[0];assert.equal(match.exact,undefined);assert.equal(match.similar.length,1);
 assert.equal(compareRecipes([{...r,ingredients:[{flavourId:'a',percent:15},{flavourId:'b',percent:2}]}],[r])[0].similar.length,0);
});
test('mixed exclusions use snapshots, ignore undone batches and deduplicate blends',()=>{
 const batches=[{recipe:r,undone:false},{recipe:{...r,name:'Same'},undone:false},{recipe:{...r,ingredients:[{flavourId:'c',percent:3}]},undone:true},{}];
 assert.equal(exclusionRecipes('mixed',[],batches).length,1);assert.equal(exclusionRecipes('saved',[r],[]).length,1);assert.equal(exclusionRecipes('none',[r],batches).length,0);
});
test('prompt includes compact exclusions without recipe notes and respects all modes',()=>{
 const recipe={...r,notes:'PRIVATE RECIPE NOTE',comments:[{text:'PRIVATE COMMENT'}]};
 const stock=[{id:'a',name:'Apple',company:'Brand',amount:10,pg:100},{id:'b',name:'Berry',company:'Other',amount:0,pg:100}];
 const output=buildPrompt(promptDefaults(),stock,[recipe],[]);
 assert.ok(output.includes('RECIPES TO AVOID (1 distinct blends'));assert.ok(output.includes('["b","Berry","Other",2]'));assert.ok(!output.includes('PRIVATE RECIPE NOTE'));assert.ok(!output.includes('PRIVATE COMMENT'));
 assert.ok(buildPrompt({...promptDefaults(),excludeRecipes:'none'},stock,[recipe],[]).includes('RECIPES TO AVOID (0 distinct blends'));
 assert.ok(buildPrompt({...promptDefaults(),excludeRecipes:'mixed'},stock,[recipe],[{recipe,undone:false}]).includes('RECIPES TO AVOID (1 distinct blends'));
});
