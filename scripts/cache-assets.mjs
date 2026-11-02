import {readdir,readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
const assets=(await readdir('dist/assets')).map(f=>'./assets/'+f);
const sw=await readFile('dist/sw.js','utf8');const hash=createHash('sha256').update(assets.join()).digest('hex').slice(0,12);
await writeFile('dist/sw.js',sw.replace("flavour-lab-v1",'flavour-lab-'+hash).replace("'./icon-512.png']","'./icon-512.png',"+assets.map(a=>JSON.stringify(a)).join(',')+']'));
