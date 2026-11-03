import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured=Boolean(url&&key);
export const cloud=configured?createClient(url,key,{auth:{flowType:'pkce',detectSessionInUrl:true}}):null;
export async function readWorkspace(){
 const {data,error}=await cloud.from('workspaces').select('document,revision').maybeSingle();
 if(error)throw error;
 return data;
}
export async function writeWorkspace(document,revision){
 const {data,error}=await cloud.rpc('save_workspace',{new_document:document,expected_revision:revision});
 if(error)throw error;
 return data;
}
