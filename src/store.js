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
 return d;
}
let initial, loadError='';try {const raw=localStorage.getItem(KEY); initial=raw?validate(JSON.parse(raw)):seed();}catch{initial=seed();loadError='Saved data could not be read. Export or recover your existing data before making changes. Storage has not been overwritten.';}
export const useLab=defineStore('lab',{state:()=>({data:initial,notice:loadError,blocked:!!loadError}),actions:{
 commit(next){if(this.blocked)throw Error('Storage recovery required. Import a valid backup first.');localStorage.setItem(KEY,JSON.stringify(next));this.data=next;},
 save(kind,item){const next=JSON.parse(JSON.stringify(this.data));const i=next[kind].findIndex(x=>x.id===item.id);if(i<0)next[kind].push(item);else next[kind][i]=item;this.commit(next);},
 mix(recipe){const result=calculate(recipe,this.data.flavours);const next=JSON.parse(JSON.stringify(this.data));next.flavours=deduct(next.flavours,result);next.batches.unshift({id:uid(),name:recipe.name,volume:recipe.volume,date:new Date().toISOString(),rows:result.rows,undone:false,recipe:structuredClone(recipe)});this.commit(next);},
 undo(id){const next=JSON.parse(JSON.stringify(this.data));const b=next.batches.find(x=>x.id===id);if(!b||b.undone)return;for(const r of b.rows){const f=next.flavours.find(f=>f.id===r.id);if(!f)throw Error('Cannot restore a missing flavour.');f.amount=round(f.amount+r.ml);}b.undone=true;this.commit(next);},
 restore(d){validate(d);localStorage.setItem(KEY,JSON.stringify(d));this.data=d;this.blocked=false;this.notice='Backup restored.';}
}});
