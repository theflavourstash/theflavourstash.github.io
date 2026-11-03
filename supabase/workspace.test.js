import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('workspace isolation, atomic writes and stale-device protection',async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated;
 grant execute on function auth.uid() to anon,authenticated;
 insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');`);
 await db.exec(await readFile(new URL('./migrations/202611030001_workspace.sql',import.meta.url),'utf8'));
 const initial={version:1,flavours:[{id:'test',amount:20}],recipes:[],batches:[]};
 const save=(doc,revision)=>db.query('select public.save_workspace($1::jsonb,$2::bigint) as revision',[JSON.stringify(doc),revision]);
 await db.exec('set role anon');
 await assert.rejects(()=>db.query('select * from public.workspaces'),/permission denied/);
 await assert.rejects(()=>save(initial,0),/permission denied/);
 await db.exec("set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'");
 assert.equal((await save(initial,0)).rows[0].revision,1);
 await assert.rejects(()=>db.query('update public.workspaces set revision=99'),/permission denied/);
 const mixed=structuredClone(initial);mixed.flavours[0].amount=15;mixed.batches=[{id:'batch1',undone:false,rows:[{id:'test',ml:5}]}];
 assert.equal((await save(mixed,1)).rows[0].revision,2);
 await assert.rejects(()=>save(initial,1),/Collection changed/);
 assert.deepEqual((await db.query('select document from public.workspaces')).rows[0].document,mixed);
 const invalid=structuredClone(mixed);invalid.flavours[0].amount=-1;
 await assert.rejects(()=>save(invalid,2),/Negative stock/);
 assert.equal((await db.query('select revision from public.workspaces')).rows[0].revision,2);
 const undone=structuredClone(mixed);undone.flavours[0].amount=20;undone.batches[0].undone=true;
 assert.equal((await save(undone,2)).rows[0].revision,3);
 await assert.rejects(()=>save(undone,2),/Collection changed/);
 await db.exec("set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002'");
 assert.equal((await db.query('select * from public.workspaces')).rows.length,0);
 await assert.rejects(()=>save(initial,3),/Collection changed/);
 await save(initial,0);
 assert.equal((await db.query('select * from public.workspaces')).rows.length,1);
 await db.exec("set request.jwt.claim.sub=''");
 await assert.rejects(()=>save(initial,0),/Sign in required/);
 }finally{await db.close();}
});
