import {test} from 'node:test';
import assert from 'node:assert/strict';
import {promptDefaults,buildPrompt,validatePrompt} from './prompt.js';
const flavours=[{name:'Test fruit',company:'Maker A',amount:5,pg:100,rating:4,notes:'PRIVATE NOTE',comments:[{text:'PRIVATE COMMENT'}]},{name:'Empty bottle',company:'Maker B',amount:0,pg:100}];
test('includes exact stock and manufacturer, excluding empty bottles and private notes by default',()=>{
 const before=JSON.stringify(flavours);const p=buildPrompt(promptDefaults(),flavours);
 assert.match(p,/Maker A/);assert.match(p,/"availableMl": 5/);assert.doesNotMatch(p,/Empty bottle|PRIVATE/);
 assert.match(p,/0.8 ohm pod/);assert.match(p,/10%/);assert.match(p,/Do not add nicotine/);assert.equal(JSON.stringify(flavours),before);
});
test('includes optional notes, preferences and nicotine settings only when requested',()=>{
 const p=buildPrompt({...promptDefaults(),includeNotes:true,nicotine:3,strength:72,nicPg:50,volume:500,profile:'Tart berries',avoid:'Coconut'},flavours);
 assert.match(p,/PRIVATE NOTE/);assert.match(p,/PRIVATE COMMENT/);assert.match(p,/500 ml/);assert.match(p,/72 mg\/ml, 50% PG/);assert.match(p,/Tart berries/);assert.match(p,/Avoid: Coconut/);
});
test('validates inputs and handles an empty collection without inventing stock',()=>{
 for(const patch of [{volume:0},{flavourTarget:NaN},{vg:101},{count:1.5},{nicotine:20,strength:18},{device:''}])assert.throws(()=>validatePrompt({...promptDefaults(),...patch}));
 assert.match(buildPrompt(promptDefaults(),[]),/No inventory means ask me for my stock/);
});
