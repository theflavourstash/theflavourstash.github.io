import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseRecipeResponse,RECIPE_FORMAT} from './recipe-import.js';
import {calculate} from './calc.js';
import {buildPrompt,promptDefaults} from './prompt.js';
const flavours=[{id:'fruit-a',name:'Fruit',company:'Maker A',amount:20,pg:100},{id:'fruit-b',name:'Fruit',company:'Maker B',amount:1,pg:100}];
const recipe=()=>({name:'Berry trial',volume:100,vg:50,nicotine:0,strength:18,nicPg:100,ingredients:[{flavourId:'fruit-a',percent:5}],notes:'Experimental. Test a small batch.',sources:['https://example.org/evidence']});
const encode=r=>JSON.stringify({format:RECIPE_FORMAT,version:1,recipes:[r],questions:[]});
test('prompt includes exact inventory IDs and the versioned return contract',()=>{
 const prompt=buildPrompt(promptDefaults(),flavours);
 assert.match(prompt,/"flavourId": "fruit-a"/);assert.match(prompt,/"flavourId": "fruit-b"/);assert.match(prompt,/"format": "flavourlab.recipe-import"/);assert.match(prompt,/Return ONLY one valid JSON object/);
});
test('valid response maps to an editable recipe and recalculates base amounts without changing stock',()=>{
 const before=JSON.stringify(flavours);const r={...recipe(),id:'overwrite-existing',rating:5,comments:[{text:'untrusted'}],pg:999,ml:999};
 const result=parseRecipeResponse(encode(r),flavours).recipes[0];
 assert.equal(result.id,undefined);assert.equal(result.rating,0);assert.deepEqual(result.comments,[]);
 assert.match(result.notes,/https:\/\/example.org\/evidence/);assert.match(result.notes,/Experimental/);
 const calc=calculate(result,flavours);assert.equal(calc.pg,45);assert.equal(calc.vg,50);assert.equal(calc.rows[0].ml,5);assert.equal(JSON.stringify(flavours),before);
});
test('accepts a single JSON code block and multiple recipes',()=>{
 const text=JSON.stringify({format:RECIPE_FORMAT,version:1,recipes:[recipe(),{...recipe(),name:'Second'}]});
 assert.equal(parseRecipeResponse('```json\n'+text+'\n```',flavours).recipes.length,2);
});
test('rejects malformed data, unknown IDs, numeric strings and impossible mixtures',()=>{
 for(const value of ['not JSON','{}',JSON.stringify({format:RECIPE_FORMAT,version:2,recipes:[]}),encode({...recipe(),volume:'100'}),encode({...recipe(),ingredients:[{flavourId:'Fruit',percent:5}]}),encode({...recipe(),ingredients:[{flavourId:'fruit-a',percent:-1}]}),encode({...recipe(),ingredients:[]}),encode({...recipe(),vg:99}),encode({...recipe(),nicotine:20}),encode({...recipe(),sources:['javascript:alert(1)']})])assert.throws(()=>parseRecipeResponse(value,flavours));
});
test('aggregates duplicate ingredients for calculation and reports stock shortage without blocking recipe storage',()=>{
 const r=recipe();r.ingredients=[{flavourId:'fruit-b',percent:1},{flavourId:'fruit-b',percent:1}];
 const parsed=parseRecipeResponse(encode(r),flavours).recipes[0];const calc=calculate(parsed,flavours);
 assert.equal(calc.rows.length,1);assert.equal(calc.rows[0].ml,2);assert.equal(calc.shortages.length,1);
 r.ingredients=[{flavourId:'fruit-a',percent:60},{flavourId:'fruit-a',percent:60}];assert.throws(()=>parseRecipeResponse(encode(r),flavours));
});
test('returns clarification questions without inventing recipes and fails atomically for a mixed-validity list',()=>{
 const questions=parseRecipeResponse(JSON.stringify({format:RECIPE_FORMAT,version:1,recipes:[],questions:['Which coolant dilution?']}),flavours);
 assert.equal(questions.recipes.length,0);assert.equal(questions.questions.length,1);
 assert.throws(()=>parseRecipeResponse(JSON.stringify({format:RECIPE_FORMAT,version:1,recipes:[recipe(),{...recipe(),volume:0}]}),flavours));
});
