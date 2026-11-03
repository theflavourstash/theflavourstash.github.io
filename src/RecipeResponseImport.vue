<script setup>
import {ref,computed,watch,nextTick} from 'vue';
import {useLab} from './store';
import {uid} from './id';
import {calculate} from './calc';
import {parseRecipeResponse} from './recipe-import';
const lab=useLab();
const response=ref(''),review=ref(null),error=ref(''),success=ref(''),saving=ref(false),reviewStock=ref('');
const stockStamp=computed(()=>JSON.stringify(lab.data.flavours));
const stale=computed(()=>review.value&&reviewStock.value!==stockStamp.value);
const fmt=n=>Number(n.toFixed(3)).toLocaleString('en-GB');
const summaries=computed(()=>review.value?.recipes.map(recipe=>({recipe,result:calculate(recipe,lab.data.flavours),existing:lab.data.recipes.some(r=>r.name.toLowerCase()===recipe.name.toLowerCase())}))||[]);
watch(response,()=>{review.value=null;error.value='';success.value='';});
watch(()=>lab.user?.id,()=>{response.value='';review.value=null;error.value='';success.value='';});
function preview(){try{review.value=parseRecipeResponse(response.value,lab.data.flavours);reviewStock.value=stockStamp.value;error.value='';success.value='';}catch(e){review.value=null;error.value=e.message;}}
async function save(){
 if(saving.value||!review.value?.recipes.length)return;
 if(stale.value){error.value='Your stock changed. Review the response again before saving.';return;}
 saving.value=true;error.value='';
 try{
  const parsed=parseRecipeResponse(response.value,lab.data.flavours);
  const next=JSON.parse(JSON.stringify(lab.data));
  next.recipes.push(...parsed.recipes.map(recipe=>({...recipe,id:uid()})));
  await lab.commit(next);
  const count=parsed.recipes.length;
  response.value='';review.value=null;
  // The response watcher clears messages on the next Vue update.
  await nextTick();
  success.value=`${count} ${count===1?'recipe saved':'recipes saved'} to your recipe book. Your stock has not changed.`;
 }catch(e){error.value=e.message;}finally{saving.value=false;}
}
</script>
<template>
 <section class="white-panel response-import">
  <div class="eyebrow">IMPORT RECIPES</div><h2>Paste AI response</h2>
  <p>Paste the complete JSON response from your AI service. Review it here, then save it as recipes you can edit and mix.</p>
  <p v-if="lab.configured&&!lab.user" class="mt-3"><RouterLink to="/settings">Sign in</RouterLink> to match the response to your flavour library and save recipes.</p>
  <label class="mt-5">AI recipe JSON<textarea v-model="response" rows="8" maxlength="200000" spellcheck="false" placeholder='Paste the response beginning with {"format": "flavourlab.recipe-import", …}' :disabled="saving"/></label>
  <div class="response-actions"><button type="button" class="primary" :disabled="!response.trim()||saving" @click="preview">Review recipes</button><button type="button" :disabled="!response||saving" @click="response=''">Clear response</button></div>
  <p v-if="error" class="response-error" role="alert">{{error}}</p>
  <p v-if="success" class="response-success" role="status">{{success}} <RouterLink to="/recipes">Open recipe book</RouterLink></p>
  <template v-if="review">
   <div v-if="review.questions.length" class="response-warning"><h3>The AI needs clarification</h3><ul><li v-for="(q,i) in review.questions" :key="i">{{q}}</li></ul></div>
   <p v-if="stale" class="response-warning">Stock has changed since this preview. Select Review recipes again.</p>
   <article v-for="({recipe:r,result,existing},i) in summaries" :key="i" class="import-recipe">
    <h3>{{r.name}}</h3><p>{{r.volume}} ml · {{r.vg}}% VG / {{100-r.vg}}% PG · {{r.nicotine}} mg/ml nicotine</p>
    <p v-if="r.nicotine>0">Nicotine base: {{r.strength}} mg/ml, {{r.nicPg}}% PG.</p>
    <p v-if="existing" class="response-warning">A recipe with this name already exists. This will add a new recipe, leaving the existing one unchanged.</p>
    <div class="import-table-wrap"><table><thead><tr><th>Ingredient</th><th>%</th><th>ml</th></tr></thead><tbody><tr v-for="row in result.rows" :key="row.id"><td>{{row.name}}<small>{{lab.data.flavours.find(f=>f.id===row.id)?.company}}</small></td><td>{{fmt(r.ingredients.filter(x=>x.flavourId===row.id).reduce((n,x)=>n+x.percent,0))}}</td><td>{{fmt(row.ml)}}</td></tr><tr><td>Nicotine base</td><td></td><td>{{fmt(result.nic)}}</td></tr><tr><td>Extra PG</td><td></td><td>{{fmt(result.pg)}}</td></tr><tr><td>Extra VG</td><td></td><td>{{fmt(result.vg)}}</td></tr></tbody></table></div>
    <p>Total flavour: {{fmt(r.ingredients.reduce((sum,line)=>sum+line.percent,0))}}%</p>
    <p v-if="result.shortages.length" class="response-warning">Not enough stock to mix this batch: {{result.shortages.map(row=>`${row.name} needs ${fmt(row.ml-row.available)} ml more`).join('; ')}}. You can still save the recipe.</p>
    <details><summary>AI notes and sources</summary><p class="import-notes">{{r.notes}}</p></details>
   </article>
   <div v-if="review.recipes.length" class="response-confirm"><p>Check the batch size, nicotine and ingredients above. The app validates quantities and recalculates base amounts, but does not verify the AI's flavour advice or sources.</p><button class="primary mt-5" :disabled="saving||lab.busy||lab.blocked||!lab.ready||!!stale" @click="save">{{saving?'Saving…':`Save ${review.recipes.length} ${review.recipes.length===1?'recipe':'recipes'}`}}</button><p v-if="lab.configured&&!lab.user" class="mt-3"><RouterLink to="/settings">Sign in</RouterLink> to load your flavour IDs and save recipes.</p></div>
  </template>
 </section>
</template>
<style scoped>
.response-import{margin-top:2rem}.response-import h2{margin:.5rem 0 .7rem}.response-import textarea{font-family:ui-monospace,monospace;font-size:.9rem;line-height:1.6}.response-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}.response-error,.response-warning,.response-success{padding:1rem;border-radius:.6rem;margin-top:1rem;overflow-wrap:anywhere}.response-error{background:var(--error);color:var(--error-text)}.response-warning{background:var(--warning);color:var(--warning-text)}.response-success{background:var(--soft);color:var(--text)}.response-import a{text-decoration:underline}.import-recipe{border:1px solid var(--border);padding:clamp(1rem,2vw,1.5rem);border-radius:.7rem;margin:1.5rem 0}.import-table-wrap{overflow:auto;margin:1rem 0}table{width:100%;border-collapse:collapse;text-align:left;font-size:.85rem}th,td{padding:.7rem .5rem;border-bottom:1px solid var(--border)}td small{display:block;color:var(--muted)}th:not(:first-child),td:not(:first-child){text-align:right}.import-notes{white-space:pre-wrap;overflow-wrap:anywhere;margin-top:1rem}.import-recipe details{margin-top:1rem}.response-confirm{border-top:1px solid var(--border);padding-top:1.5rem}ul{list-style:disc;padding-left:1.2rem;margin-top:.5rem}li{line-height:1.7}
</style>
