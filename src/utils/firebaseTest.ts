import { auth, db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Testando conexão com Firebase...');
    
    // Teste 1: Verificar se o Firebase Auth está funcionando
    console.log('Auth currentUser:', auth.currentUser);
    console.log('Auth config:', {
      apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
      authDomain: auth.app.options.authDomain,
      projectId: auth.app.options.projectId
    });
    
    // Teste 2: Verificar se o Firestore está acessível
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    console.log('✅ Firestore conectado com sucesso');
    
    return { success: true, message: 'Firebase conectado com sucesso' };
  } catch (error) {
    console.error('❌ Erro na conexão com Firebase:', error);
    return { success: false, error };
  }
};

export const logFirebaseConfig = () => {
  console.log('🔧 Configuração do Firebase:', {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID?.substring(0, 20) + '...'
  });
};