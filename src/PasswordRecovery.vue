<script setup>
import {ref,watch,nextTick,onBeforeUnmount} from 'vue';
import {useLab} from './store';
import {cloud} from './cloud';
import {requestPasswordReset,updateRecoveredPassword} from './recovery.js';
const lab=useLab(),email=ref(''),password=ref(''),confirmation=ref(''),busy=ref(false),message=ref(''),error=ref(''),cooldown=ref(false),heading=ref(null);
let timer;
onBeforeUnmount(()=>clearTimeout(timer));
watch(()=>lab.recovering,async()=>{password.value='';confirmation.value='';error.value='';message.value='';await nextTick();heading.value?.focus();},{immediate:true});
async function request(){
 if(busy.value||cooldown.value||!cloud)return;
 busy.value=true;error.value='';message.value='';
 try{message.value=await requestPasswordReset(cloud.auth,email.value,window.location);cooldown.value=true;timer=setTimeout(()=>cooldown.value=false,60000);}
 catch(e){error.value=e.message;}
 finally{busy.value=false;}
}
async function update(){
 if(busy.value||!lab.recovering||!cloud)return;
 busy.value=true;error.value='';
 try{await updateRecoveredPassword(cloud.auth,password.value,confirmation.value);password.value='';confirmation.value='';lab.finishRecovery();await nextTick();message.value='Password updated. You can now use your new password to sign in on your devices.';}
 catch(e){error.value=e.message;}
 finally{busy.value=false;}
}
</script>
<template>
<section class="password-recovery" aria-labelledby="recovery-heading">
<h2 id="recovery-heading" ref="heading" tabindex="-1">{{lab.recovering?'Choose a new password':'Forgot your password?'}}</h2>
<p v-if="lab.recoveryError" role="alert">{{lab.recoveryError}}</p>
<form v-if="lab.recovering" @submit.prevent="update" :aria-busy="busy">
<p>Your reset link has been verified. Set a new password below.</p>
<label>New password<input v-model="password" type="password" autocomplete="new-password" minlength="12" required aria-describedby="password-help"/></label>
<p id="password-help">Use at least 12 characters. A password manager or a long, unique passphrase works well. Pasting is supported.</p>
<label>Confirm new password<input v-model="confirmation" type="password" autocomplete="new-password" minlength="12" required/></label>
<div class="recovery-actions"><button class="primary" :disabled="busy">{{busy?'Updating…':'Update password'}}</button><button type="button" :disabled="busy" @click="lab.finishRecovery()">Cancel</button></div>
</form>
<form v-else @submit.prevent="request" :aria-busy="busy">
<p>Enter your account email. Open the reset link in the same browser and device where you request it. A link opened in another browser or an expired link may require a new request.</p>
<label>Email for password reset<input v-model="email" type="email" autocomplete="email" required/></label>
<button class="primary" :disabled="busy||cooldown||!lab.configured">{{busy?'Requesting email…':cooldown?'Wait a minute before resending':'Send reset email'}}</button>
</form>
<p v-if="error" class="recovery-error" role="alert">{{error}}</p>
<p v-if="message" class="recovery-success" role="status">{{message}}</p>
</section>
</template>
<style scoped>
.password-recovery{max-width:42rem}.password-recovery h2{margin-bottom:var(--space-md)}.password-recovery label{margin:var(--space-md) 0}.recovery-actions{display:flex;gap:var(--space-sm) .75rem;flex-wrap:wrap;margin-top:var(--space-md)}.recovery-error,.recovery-success{padding:var(--space-md) 1rem;border-radius:.5rem;margin-top:var(--space-md)}.recovery-error{color:var(--error-text);background:var(--error)}.recovery-success{color:var(--mint-text);background:var(--mint)}
</style>
