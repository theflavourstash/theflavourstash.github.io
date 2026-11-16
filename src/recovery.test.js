import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestPasswordReset,updateRecoveredPassword,recoveryRedirect} from './recovery.js';
test('recovery redirect removes auth parameters and hash routes',()=>{
 assert.equal(recoveryRedirect({origin:'https://theflavourstash.github.io',pathname:'/',search:'?code=secret',hash:'#/settings'}),'https://theflavourstash.github.io/');
});
test('reset requests use trimmed email and generic account-safe confirmation',async()=>{
 let request;
 const auth={resetPasswordForEmail:async(...args)=>{request=args;return {error:null};}};
 const text=await requestPasswordReset(auth,' user@example.com ',{origin:'https://example.com',pathname:'/'});
 assert.deepEqual(request,['user@example.com',{redirectTo:'https://example.com/'}]);assert.match(text,/If an account exists/);
 await assert.rejects(requestPasswordReset(auth,'invalid',{origin:'https://example.com',pathname:'/'}),/valid email/);
});
test('reset delivery errors are surfaced',async()=>{
 await assert.rejects(requestPasswordReset({resetPasswordForEmail:async()=>({error:Error('rate limited')})},'a@b.com',{origin:'https://example.com',pathname:'/'}),/rate limited/);
});
test('password update requires matching sufficiently long passwords and verified session',async()=>{
 let writes=0;
 const auth={getUser:async()=>({data:{user:{id:'user'}},error:null}),updateUser:async({password})=>{assert.equal(password,'long unique password');writes++;return {error:null};}};
 await assert.rejects(updateRecoveredPassword(auth,'short','short'),/12 characters/);
 await assert.rejects(updateRecoveredPassword(auth,'long unique password','different password'),/do not match/);
 await updateRecoveredPassword(auth,'long unique password','long unique password');assert.equal(writes,1);
 await assert.rejects(updateRecoveredPassword({...auth,getUser:async()=>({data:{user:null},error:Error('expired')})},'long unique password','long unique password'),/expired/);
 assert.equal(writes,1);
 await assert.rejects(updateRecoveredPassword({...auth,updateUser:async()=>({error:Error('rejected')})},'long unique password','long unique password'),/rejected/);
});
