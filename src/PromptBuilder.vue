<script setup>
import RecipeResponseImport from './RecipeResponseImport.vue';
import {ref,computed,watch} from 'vue';
import {Copy,SlidersHorizontal,FileText} from 'lucide-vue-next';
import {useLab} from './store';
import {promptDefaults,validatePrompt,buildPrompt} from './prompt';
const lab=useLab();
const form=ref(promptDefaults()),output=ref(''),message=ref(''),outputField=ref(null),generatedFrom=ref('');
const stocked=computed(()=>lab.data.flavours.filter(f=>f.amount>0));
const fingerprint=computed(()=>JSON.stringify([form.value,lab.data.flavours]));
const stale=computed(()=>output.value&&generatedFrom.value!==fingerprint.value);
watch(()=>lab.data.promptDefaults,p=>{form.value={...promptDefaults(),...(p||{})};},{immediate:true});
watch(()=>lab.user?.id,()=>{form.value=promptDefaults();output.value='';message.value='';});
function generate(){try{output.value=buildPrompt(form.value,lab.data.flavours);generatedFrom.value=fingerprint.value;message.value='Prompt ready. Review it, then copy into your chosen AI service.';}catch(e){message.value=e.message;}}
async function save(){try{validatePrompt(form.value);await lab.commit({...JSON.parse(JSON.stringify(lab.data)),promptDefaults:JSON.parse(JSON.stringify(form.value))});message.value=lab.configured?'Defaults saved to your account.':'Defaults saved on this device.';}catch(e){message.value=e.message;}}
function reset(){form.value={...promptDefaults(),...(lab.data.promptDefaults||{})};message.value='Saved defaults loaded.';}
async function copy(){try{await navigator.clipboard.writeText(output.value);message.value='Prompt copied.';}catch{outputField.value?.focus();outputField.value?.select();message.value='Automatic copying is unavailable. The prompt is selected: use your device’s Copy command.';}}
</script>
<template>
 <section class="page-heading"><div><div class="eyebrow">RECIPE ASSISTANT</div><h1>Recipe prompts</h1><p>Build a prompt from your stock, then import the resulting recipes.</p></div></section>
 <div class="prompt-intro"><FileText :size="22"/><p>Set your preferences, generate a prompt, then paste it into an AI service. Bring the JSON response back below to create recipes. Nothing is sent automatically and your stock stays unchanged.</p></div>
 <p v-if="message" class="prompt-message" style="margin-bottom:1.5rem" role="status">{{message}}</p>
 <div class="prompt-layout">
 <form class="white-panel prompt-form" @submit.prevent="generate">
  <div class="section-number"><SlidersHorizontal :size="20"/><h2>Your defaults</h2></div>
  <label>Device / pod<input v-model="form.device" maxlength="3000" required/></label>
  <div class="field-grid mt-6">
   <label>Batch size (ml)<input v-model.number="form.volume" type="number" min="1" max="10000" step="any" required/></label>
   <label>Preferred total flavour (%)<input v-model.number="form.flavourTarget" type="number" min="0.1" max="100" step="any" required/></label>
   <label>Target VG (%)<input v-model.number="form.vg" type="number" min="0" max="100" step="any" required/></label>
   <label>Recipe suggestions<select v-model.number="form.count"><option v-for="n in 5" :value="n">{{n}}</option></select></label>
   <label>Target nicotine (mg/ml)<input v-model.number="form.nicotine" type="number" min="0" max="100" step="any" required/></label>
   <div class="field-note">{{form.vg}}% VG / {{100-form.vg}}% PG<small>Flavour total includes sweetener and cooling.</small></div>
  </div>
  <div v-if="form.nicotine>0" class="field-grid mt-6"><label>Nicotine base (mg/ml)<input v-model.number="form.strength" type="number" min="0.1" max="1000" step="any" required/></label><label>Nicotine base PG (%)<input v-model.number="form.nicPg" type="number" min="0" max="100" step="any" required/></label></div>
  <hr/><h2>Flavour preferences</h2>
  <label class="mt-5">Flavour profile<textarea v-model="form.profile" rows="2" maxlength="3000" placeholder="e.g. Bright tropical fruit with a little tartness"/></label>
  <label class="mt-5">Flavours or ingredients to avoid<input v-model="form.avoid" maxlength="3000" placeholder="e.g. Coconut, mango, menthol"/></label>
  <div class="field-grid mt-6"><label>Sweetness<select v-model="form.sweetness"><option v-for="v in ['No added sweetener','Light','Balanced','Sweet','Very sweet']">{{v}}</option></select></label><label>Cooling<select v-model="form.cooling"><option v-for="v in ['None','Light','Medium','Strong']">{{v}}</option></select></label></div>
  <label class="mt-5">Other preferences<textarea v-model="form.extra" rows="3" maxlength="3000" placeholder="Preferred concentrates, a particular sweetener percentage, steep time…"/></label>
  <label class="prompt-checkbox mt-6"><input v-model="form.includeNotes" type="checkbox"/><span>Include my flavour ratings, notes and comments in the copied prompt</span></label>
  <div class="prompt-actions"><button type="button" :disabled="lab.busy||lab.blocked||!lab.ready" @click="save">Save defaults</button><button type="button" @click="reset">Load saved defaults</button></div>
  <p v-if="lab.configured&&!lab.user" class="mt-3"><RouterLink to="/settings" class="prompt-link">Sign in</RouterLink> to save defaults and include your cloud inventory. You can still draft a prompt here.</p>
  <p v-else class="mt-3">Changes apply to this prompt. Choose Save defaults to keep them for next time.</p>
  <button type="submit" class="primary w-full mt-6">Generate prompt <FileText :size="18"/></button>
 </form>
 <section class="white-panel prompt-preview">
  <div class="prompt-preview-head"><div><div class="eyebrow">READY TO COPY</div><h2>Your recipe brief</h2></div><span class="pill">{{stocked.length}} in-stock flavours</span></div>
  <p class="mt-5">The prompt asks for exact manufacturer research, supporting sources, sensible percentages and a stock check. An AI response still needs your review.</p>
  <p v-if="!stocked.length" class="prompt-warning mt-5">No in-stock flavours are loaded. The prompt will ask for your inventory before suggesting recipes.</p>
  <p v-if="lab.blocked&&lab.user" class="prompt-warning mt-5">Your cloud collection needs a refresh in Settings. Stock in a generated prompt may be out of date.</p>
  <p v-if="stale" class="prompt-warning mt-5">Settings or stock have changed. Generate the prompt again before copying.</p>
  <label v-if="output" class="mt-6">Generated prompt<textarea ref="outputField" class="prompt-output" :value="output" readonly rows="25" spellcheck="false"/></label>
  <div v-else class="empty-state"><FileText :size="36"/><h3>Your prompt preview</h3><p>Your generated prompt will appear here, ready to review and copy.</p></div>
  <button class="primary w-full mt-5" :disabled="!output||!!stale" @click="copy"><Copy :size="18"/>Copy prompt</button>

 </section>
 </div>
 <RecipeResponseImport/>
</template>
<style scoped>
.prompt-intro{display:flex;align-items:center;gap:1rem;padding:1.25rem 1.5rem;background:var(--soft);border-radius:.8rem;margin-bottom:1.8rem}.prompt-intro svg{flex-shrink:0}.prompt-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1.8rem;align-items:start}.prompt-form,.prompt-preview{min-width:0}.prompt-preview-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;align-items:center}.prompt-actions{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.5rem}.prompt-checkbox{display:flex;align-items:flex-start;gap:.65rem;line-height:1.6}.prompt-checkbox input{width:1rem;height:1rem;margin-top:.2rem;flex-shrink:0}.prompt-output{font-family:ui-monospace,monospace;font-size:.9rem;line-height:1.65;min-height:24rem;max-height:55rem;background:var(--surface)}.prompt-warning{background:var(--warning);color:var(--warning-text);padding:1rem;border-radius:.5rem}.prompt-message{background:var(--soft);color:var(--text);padding:1rem;border-radius:.5rem}.prompt-link{text-decoration:underline}.field-note small{display:block}.prompt-preview h2{margin-top:.4rem}@media(max-width:1100px){.prompt-layout{grid-template-columns:1fr}.prompt-output{min-height:20rem}}@media(max-width:420px){.field-grid{grid-template-columns:1fr}.prompt-intro{padding:1rem}}
</style>
