import { auth } from '../lib/firebase';

export const debugAuth = () => {
  console.log('🔍 Debug Auth State:');
  console.log('- auth object:', auth);
  console.log('- auth.currentUser:', auth.currentUser);
  console.log('- auth.currentUser?.uid:', auth.currentUser?.uid);
  console.log('- auth.currentUser?.email:', auth.currentUser?.email);
  
  return {
    hasAuth: !!auth,
    hasCurrentUser: !!auth.currentUser,
    uid: auth.currentUser?.uid,
    email: auth.currentUser?.email
  };
};