export function recoveryRedirect(location) {
 return location.origin + location.pathname;
}
export async function requestPasswordReset(auth,email,location) {
 const address=email.trim();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))throw Error('Enter a valid email address.');
 const {error}=await auth.resetPasswordForEmail(address,{redirectTo:recoveryRedirect(location)});
 if(error)throw error;
 return 'If an account exists for that address, a reset email has been requested. Check your inbox and spam folder. Open the newest link in this same browser and device.';
}
export async function updateRecoveredPassword(auth,password,confirmation) {
 if(password.length<12)throw Error('Use at least 12 characters for your new password.');
 if(password!==confirmation)throw Error('The passwords do not match.');
 const {data,error:sessionError}=await auth.getUser();
 if(sessionError||!data?.user)throw Error('This reset session has expired. Request a new reset email.');
 const {error}=await auth.updateUser({password});
 if(error)throw error;
}
