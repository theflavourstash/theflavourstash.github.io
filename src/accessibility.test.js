import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('./style.css',import.meta.url),'utf8');
const lum=h=>{const a=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
for(const selector of [':root',':root[data-theme=dark]'])test(selector+' colour role pairs meet enhanced text contrast',()=>{
 const start=css.indexOf(selector+' {');const block=css.slice(start,css.indexOf('\n}',start));
 const p=Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})\b/gi)].map(m=>[m[1],m[2]]));
 const pairs=[...['text','muted'].flatMap(f=>['bg','surface','soft','mint','lavender','warning','error','control-bg'].map(b=>[f,b])),['on-accent','accent'],['on-accent','accent-hover'],['mint-text','mint'],['lavender-text','lavender'],['warning-text','warning'],['error-text','error'],['error-text','surface'],['star','surface']];
 for(const [f,b] of pairs)assert.ok(ratio(p[f],p[b])>=7,f+' on '+b+' must reach 7:1');
 for(const b of ['bg','surface','control-bg'])assert.ok(ratio(p['control-border'],p[b])>=3,'control outline on '+b);
});
