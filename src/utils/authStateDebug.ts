import { auth } from '../lib/firebase';

export const debugAuthState = () => {
  console.group('🔍 Auth State Debug');
  console.log('Auth object:', auth);
  console.log('Current user:', auth.currentUser);
  console.log('User UID:', auth.currentUser?.uid);
  console.log('User email:', auth.currentUser?.email);
  console.log('User display name:', auth.currentUser?.displayName);
  console.log('User photo URL:', auth.currentUser?.photoURL);
  console.log('User email verified:', auth.currentUser?.emailVerified);
  console.log('User provider data:', auth.currentUser?.providerData);
  console.log('User metadata:', auth.currentUser?.metadata);
  
  // Verificar localStorage para logs de auth
  try {
    const authLog = localStorage.getItem('fonte:auth-log');
    if (authLog) {
      const logs = JSON.parse(authLog);
      console.log('Auth lifecycle logs (últimos 5):', logs.slice(-5));
    }
  } catch (e) {
    console.warn('Erro ao ler logs de auth:', e);
  }
  
  console.groupEnd();
};

export const monitorAuthChanges = () => {
  let changeCount = 0;
  
  return auth.onAuthStateChanged((user) => {
    changeCount++;
    console.group(`🔄 Auth State Change #${changeCount}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('User:', user);
    console.log('User UID:', user?.uid);
    console.log('User email:', user?.email);
    console.groupEnd();
  });
};