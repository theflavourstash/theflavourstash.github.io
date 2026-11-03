import {validatePrompt,promptDefaults} from './prompt';
import {cloud,configured,readWorkspace,writeWorkspace} from './cloud';
import {uid} from "./id";
import {defineStore} from 'pinia';
import {seed} from './seed';
import {calculate,deduct,round} from './calc';
export const KEY='flavour-lab-v1';
export function validate(d){
 if(d?.version!==1||!Array.isArray(d.flavours)||!Array.isArray(d.recipes)||!Array.isArray(d.batches)) throw Error('Unsupported backup format.');
 const ids=new Set();
 for(const f of d.flavours){if(typeof f.id!=='string'||ids.has(f.id)||typeof f.name!=='string'||!f.name.trim()||typeof f.company!=='string'||!Number.isFinite(f.amount)||f.amount<0||!Number.isFinite(f.pg)||f.pg<0||f.pg>100) throw Error('Invalid flavour data.'); ids.add(f.id);}
 for(const list of [d.flavours,d.recipes]) for(const x of list) if(!Number.isInteger(x.rating)||x.rating<0||x.rating>5||!Array.isArray(x.comments)||x.comments.some(c=>typeof c.text!=='string'||typeof c.date!=='string')) throw Error('Invalid notes or ratings.');
 const recipeIds=new Set();for(const r of d.recipes){if(typeof r.id!=='string'||recipeIds.has(r.id)||typeof r.name!=='string'||!Array.isArray(r.ingredients)||calculate(r,d.flavours).errors.length) throw Error('Invalid recipe data.');recipeIds.add(r.id);}
 const batchIds=new Set();for(const b of d.batches){if(typeof b.id!=='string'||batchIds.has(b.id)||typeof b.name!=='string'||typeof b.date!=='string'||!Number.isFinite(b.volume)||b.volume<=0||typeof b.undone!=='boolean'||!Array.isArray(b.rows)||b.rows.some(r=>!ids.has(r.id)||typeof r.name!=='string'||!Number.isFinite(r.ml)||r.ml<0)) throw Error('Invalid batch data.');batchIds.add(b.id);}
 if(d.promptDefaults!==undefined)validatePrompt({...promptDefaults(),...d.promptDefaults});
 return d;
}
function localData(){const raw=localStorage.getItem(KEY);return raw?validate(JSON.parse(raw)):seed();}
let initial=seed(),loadError='';
if(!configured)try{initial=localData();}catch{loadError='Saved data could not be read. Export the stored data before importing a valid backup.';}
export const useLab=defineStore('lab',{state:()=>({data:initial,notice:loadError,blocked:!!loadError,configured,user:null,ready:!configured,busy:false,revision:0}),actions:{
 async init(){
  if(!cloud)return;
  cloud.auth.onAuthStateChange((_event,session)=>{
   const user=session?.user||null;
   if(user?.id===this.user?.id&&this.ready)return;
   this.user=user;this.data=seed();this.revision=0;this.blocked=true;this.ready=false;
   if(!user){this.ready=true;this.notice='Sign in from Settings to open your cloud collection.';return;}
   setTimeout(()=>this.refresh().catch(e=>{this.notice=e.message;}),0);
  });
  const {error}=await cloud.auth.getSession();
  if(error){this.ready=true;this.notice=error.message;}
 },
 async refresh(){
  if(!this.user||this.busy)return;
  const owner=this.user.id;
  this.busy=true;this.blocked=true;
  try{
   const row=await readWorkspace();
   if(this.user?.id!==owner)return;
   this.data=row?validate(row.document):seed();this.revision=row?.revision||0;
   this.blocked=false;this.notice='';
  }catch(e){this.notice='Cloud collection could not be loaded. Check your connection and refresh. '+e.message;throw e;}
  finally{this.ready=true;this.busy=false;}
 },
 async commit(next,{recovery=false}={}){
  if(this.busy)throw Error('Please wait for the current change to finish.');
  if(this.blocked&&!(!configured&&recovery))throw Error('Refresh your collection before making changes.');
  validate(next);
  if(!configured){localStorage.setItem(KEY,JSON.stringify(next));this.data=next;this.blocked=false;return;}
  if(!this.user)throw Error('Sign in to save your collection.');
  if(!navigator.onLine)throw Error('Connect to the internet before saving or mixing.');
  const owner=this.user.id;this.busy=true;
  try{
   const revision=await writeWorkspace(next,this.revision);
   if(this.user?.id!==owner)return;
   this.revision=revision;this.data=next;this.notice='';
  }catch(e){
   this.blocked=true;
   this.notice='Save not confirmed. Refresh from Settings before retrying, and check batch history to avoid recording the same mix twice. '+e.message;
   throw Error(this.notice);
  }finally{this.busy=false;}
 },
 async save(kind,item){const next=JSON.parse(JSON.stringify(this.data));const i=next[kind].findIndex(x=>x.id===item.id);if(i<0)next[kind].push(item);else next[kind][i]=item;await this.commit(next);},
 async mix(recipe){const result=calculate(recipe,this.data.flavours);const next=JSON.parse(JSON.stringify(this.data));next.flavours=deduct(next.flavours,result);next.batches.unshift({id:uid(),name:recipe.name,volume:recipe.volume,date:new Date().toISOString(),rows:result.rows,undone:false,recipe:structuredClone(recipe)});await this.commit(next);},
 async undo(id){const next=JSON.parse(JSON.stringify(this.data));const b=next.batches.find(x=>x.id===id);if(!b||b.undone)return;for(const r of b.rows){const f=next.flavours.find(f=>f.id===r.id);if(!f)throw Error('Cannot restore a missing flavour.');f.amount=round(f.amount+r.ml);}b.undone=true;await this.commit(next);},
 async restore(d){await this.commit(validate(d),{recovery:true});this.notice='Backup restored.';},
 localBackup(){return localData();},
 async authenticate(email,password,signup=false){
  if(!cloud)throw Error('Supabase has not been configured yet.');
  const {error}=await cloud.auth[signup?'signUp':'signInWithPassword']({email,password,...(signup?{options:{emailRedirectTo:window.location.origin+window.location.pathname}}:{})});
  if(error)throw error;
  return signup?'Account created. Check your email to confirm, then sign in.':'Signed in.';
 },
 async signOut(){if(this.busy)throw Error('Wait for your save to finish.');const {error}=await cloud.auth.signOut();if(error)throw error;}
}});
