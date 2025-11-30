import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export const testFirebaseConnectivity = async () => {
  console.log('🧪 Iniciando teste de conectividade Firebase...');
  
  try {
    // Teste 1: Verificar configuração
    console.log('📋 Configuração Firebase:', {
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    });

    // Teste 2: Tentar ler da coleção test
    console.log('📖 Testando leitura...');
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('✅ Leitura bem-sucedida. Documentos encontrados:', snapshot.size);

    // Teste 3: Tentar escrever na coleção test
    console.log('✍️ Testando escrita...');
    const testDoc = {
      message: 'Teste de conectividade',
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    };
    
    const docRef = await addDoc(testCollection, testDoc);
    console.log('✅ Escrita bem-sucedida. ID do documento:', docRef.id);

    return {
      success: true,
      message: 'Conectividade Firebase OK',
      details: {
        canRead: true,
        canWrite: true,
        documentsFound: snapshot.size,
        testDocId: docRef.id
      }
    };

  } catch (error) {
    console.error('❌ Erro no teste de conectividade:', error);
    return {
      success: false,
      message: 'Erro na conectividade Firebase',
      error: error
    };
  }
};