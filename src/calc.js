export const round = n => Math.round((n + Number.EPSILON)*1e6)/1e6;
export function calculate(recipe,flavours){
 const errors=[]; const {volume,vg,nicotine,strength,nicPg,ingredients}=recipe;
 if(!Number.isFinite(volume)||volume<=0) errors.push('Enter a batch size greater than zero.');
 for(const [label,value] of [['VG',vg],['Nicotine carrier PG',nicPg]]) if(!Number.isFinite(value)||value<0||value>100) errors.push(`${label} must be between 0 and 100%.`);
 if(!Number.isFinite(nicotine)||nicotine<0||!Number.isFinite(strength)||strength<=0||nicotine>strength) errors.push('Check nicotine target and base strength.');
 const totals=new Map();
 for(const line of ingredients){if(!Number.isFinite(line.percent)||line.percent<=0||line.percent>100) errors.push('Each flavour needs a percentage above 0 and at most 100.'); totals.set(line.flavourId,(totals.get(line.flavourId)||0)+line.percent);}
 const rows=[...totals].map(([id,percent])=>{const f=flavours.find(x=>x.id===id);if(!f) errors.push('Choose a flavour for every ingredient.');return {id,name:f?.name||'Missing flavour',ml:round(volume*percent/100),pg:f?.pg??100,available:f?.amount??0};});
 const nic=nicotine===0?0:volume*nicotine/strength;
 const pg=volume*(100-vg)/100-rows.reduce((s,r)=>s+r.ml*r.pg/100,0)-nic*nicPg/100;
 const vgMl=volume*vg/100-rows.reduce((s,r)=>s+r.ml*(100-r.pg)/100,0)-nic*(100-nicPg)/100;
 if(pg< -0.000001||vgMl< -0.000001) errors.push('This PG/VG ratio is not achievable with these ingredients.');
 if(rows.reduce((s,r)=>s+r.ml,0)>volume+0.000001) errors.push('Flavour percentages exceed 100%.');
 const shortages=rows.filter(r=>r.ml>r.available+0.000001);
 return {rows,nic:round(nic),pg:round(Math.max(0,pg)),vg:round(Math.max(0,vgMl)),errors:[...new Set(errors)],shortages};
}
export function deduct(flavours,result){if(result.errors.length||result.shortages.length) throw Error('Resolve recipe errors and stock shortages first.');return flavours.map(f=>({...f,amount:round(f.amount-(result.rows.find(r=>r.id===f.id)?.ml||0))}));}
