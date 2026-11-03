import {calculate} from './calc.js';
export const RECIPE_FORMAT='flavourlab.recipe-import';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function string(value,label,max){if(typeof value!=='string'||value.length>max)throw Error(`${label} must be text of at most ${max} characters.`);return value.trim();}
export function parseRecipeResponse(text,flavours){
 if(typeof text!=='string'||text.length>200000)throw Error('Paste a response under 200,000 characters.');
 const trimmed=text.trim();
 const fenced=trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
 let payload;try{payload=JSON.parse(fenced?fenced[1]:trimmed);}catch{throw Error('The response is not valid JSON. Copy the complete JSON object or its single JSON code block, without surrounding commentary.');}
 if(!object(payload)||payload.format!==RECIPE_FORMAT||payload.version!==1)throw Error('Unsupported recipe format. Generate a fresh prompt and ask the AI to follow its JSON format.');
 if(!Array.isArray(payload.recipes)||payload.recipes.length>5)throw Error('The response must contain a recipes array with at most five recipes.');
 const questions=payload.questions===undefined?[]:payload.questions;
 if(!Array.isArray(questions)||questions.length>20)throw Error('Questions must be a list of at most 20 items.');
 const cleanQuestions=questions.map(q=>string(q,'Question',2000));
 const recipes=payload.recipes.map((r,index)=>{
  const label=`Recipe ${index+1}`;
  if(!object(r))throw Error(`${label} must be an object.`);
  const name=string(r.name,`${label} name`,120);if(!name)throw Error(`${label} needs a name.`);
  const notes=string(r.notes??'',`${label} notes`,12000);
  for(const [key,min,max] of [['volume',1,10000],['vg',0,100],['nicotine',0,100],['strength',0.1,1000],['nicPg',0,100]])
   if(!Number.isFinite(r[key])||r[key]<min||r[key]>max)throw Error(`${label}: ${key} must be a number from ${min} to ${max}, without units.`);
  if(!Array.isArray(r.ingredients)||r.ingredients.length<1||r.ingredients.length>30)throw Error(`${label} needs between 1 and 30 ingredients.`);
  const ingredients=r.ingredients.map((line,i)=>{
   if(!object(line)||typeof line.flavourId!=='string'||!flavours.some(f=>f.id===line.flavourId))throw Error(`${label}, ingredient ${i+1}: unknown flavour ID. Use IDs from a fresh prompt for this collection; names cannot replace IDs.`);
   if(!Number.isFinite(line.percent)||line.percent<=0||line.percent>100)throw Error(`${label}, ingredient ${i+1}: percent must be a number above 0 and at most 100.`);
   return {flavourId:line.flavourId,percent:line.percent};
  });
  const sources=r.sources??[];
  if(!Array.isArray(sources)||sources.length>20)throw Error(`${label}: sources must be a list of at most 20 URLs.`);
  const cleanSources=sources.map(s=>{
   const value=string(s,`${label} source`,2000);
   try{if(!['https:','http:'].includes(new URL(value).protocol))throw Error();}catch{throw Error(`${label}: source links must be valid HTTP or HTTPS URLs.`);}
   return value;
  });
  const recipe={name,volume:r.volume,vg:r.vg,nicotine:r.nicotine,strength:r.strength,nicPg:r.nicPg,ingredients,rating:0,comments:[],notes:['Imported AI suggestion. Review and test before mixing.',notes,cleanSources.length?'AI-provided sources (not verified by the app):\n'+cleanSources.join('\n'):''].filter(Boolean).join('\n\n')};
  const result=calculate(recipe,flavours);
  if(result.errors.length)throw Error(`${label} (${name}): ${result.errors.join(' ')}`);
  return recipe;
 });
 if(!recipes.length&&!cleanQuestions.length)throw Error('The response contains no recipes or clarification questions.');
 return {recipes,questions:cleanQuestions};
}
