function blend(recipe) {
 const totals=new Map();
 for(const i of recipe.ingredients||[])totals.set(i.flavourId,(totals.get(i.flavourId)||0)+i.percent);
 return [...totals].sort(([a],[b])=>a.localeCompare(b));
}
export const recipeSignature=r=>JSON.stringify(blend(r).map(([id,p])=>[id,Math.round(p*1e6)/1e6]));
export function exclusionRecipes(mode,recipes=[],batches=[]){
 const candidates=mode==='saved'?recipes:mode==='mixed'?batches.filter(b=>!b.undone&&b.recipe).map(b=>b.recipe):[];
 return [...new Map(candidates.map(r=>[recipeSignature(r),r])).values()];
}
export function compareRecipes(incoming,existing=[]){
 const seen=[...existing];
 return incoming.map(recipe=>{
  const signature=recipeSignature(recipe);
  const exact=seen.find(r=>recipeSignature(r)===signature);
  const a=new Map(blend(recipe));
  const similar=exact?[]:seen.filter(r=>{
   const b=new Map(blend(r)),ids=new Set([...a.keys(),...b.keys()]);
   const shared=[...a.keys()].filter(id=>b.has(id)).length;
   const difference=[...ids].reduce((n,id)=>n+Math.abs((a.get(id)||0)-(b.get(id)||0)),0);
   return shared/ids.size>=.75&&difference<=4;
  });
  if(!exact)seen.push(recipe);
  return {recipe,exact,similar};
 });
}
