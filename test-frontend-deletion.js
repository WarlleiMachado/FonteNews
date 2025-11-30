import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM",
  authDomain: "fontenews-877a3.firebaseapp.com",
  projectId: "fontenews-877a3",
  storageBucket: "fontenews-877a3.firebasestorage.app",
  messagingSenderId: "920658565832",
  appId: "1:920658565832:web:33f3aea58c6a9377f4e3fd",
  measurementId: "G-6C8W88C3XN"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testFrontendDeletion() {
  console.log('🔍 Testando processo de exclusão do frontend...\n');

  try {
    // 1. Fazer login como admin (substitua por credenciais reais)
    console.log('🔐 Fazendo login...');
    // Comentado para evitar exposição de credenciais
    // await signInWithEmailAndPassword(auth, 'admin@example.com', 'password');
    console.log('✅ Login simulado (pule se não tiver credenciais)');

    // 2. Criar documento de teste
    const testId = 'frontend-test-' + Date.now();
    const testDoc = {
      title: 'Teste Frontend',
      content: 'Documento para testar exclusão do frontend',
      createdAt: serverTimestamp(),
      authorId: 'test-user',
      published: true
    };

    console.log('📝 Criando documento de teste...');
    const docRef = doc(db, 'announcements', testId);
    await setDoc(docRef, testDoc);
    console.log('✅ Documento criado com ID:', testId);

    // 3. Verificar se existe (simulando o frontend)
    console.log('\n🔍 Verificando existência antes da exclusão...');
    const beforeDelete = await getDoc(docRef);
    console.log('Existe antes da exclusão:', beforeDelete.exists());
    
    if (beforeDelete.exists()) {
      console.log('Dados do documento:', beforeDelete.data());
    }

    // 4. Simular processo de exclusão do frontend
    console.log('\n🗑️ Iniciando processo de exclusão (simulando frontend)...');
    
    // Verificar existência novamente (como no código do frontend)
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      console.log('❌ Documento não encontrado antes da exclusão');
      return;
    }
    
    console.log('✅ Documento encontrado, prosseguindo com exclusão...');
    
    // Executar exclusão
    await deleteDoc(docRef);
    console.log('✅ Comando de exclusão executado');
    
    // Aguardar um pouco (como no código atualizado)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se foi realmente excluído
    const afterDelete = await getDoc(docRef);
    console.log('Existe após exclusão:', afterDelete.exists());
    
    if (afterDelete.exists()) {
      console.log('❌ PROBLEMA: Documento ainda existe após exclusão!');
      console.log('Dados restantes:', afterDelete.data());
    } else {
      console.log('✅ Documento excluído com sucesso');
    }

    // 5. Testar exclusão consecutiva (cenário do usuário)
    console.log('\n🔄 Testando exclusões consecutivas...');
    
    const testIds = [];
    for (let i = 0; i < 3; i++) {
      const id = `consecutive-frontend-${Date.now()}-${i}`;
      const consecutiveDoc = {
        title: `Teste Consecutivo Frontend ${i + 1}`,
        content: 'Teste de exclusão consecutiva do frontend',
        createdAt: serverTimestamp(),
        authorId: 'test-user',
        published: true
      };
      
      const consecutiveRef = doc(db, 'announcements', id);
      await setDoc(consecutiveRef, consecutiveDoc);
      testIds.push(id);
      console.log(`📝 Criado documento ${i + 1}: ${id}`);
      
      // Pequeno delay entre criações
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Excluir todos rapidamente (simulando cliques rápidos do usuário)
    console.log('\n🗑️ Excluindo documentos consecutivamente...');
    for (let i = 0; i < testIds.length; i++) {
      const id = testIds[i];
      console.log(`Excluindo documento ${i + 1}...`);
      
      const consecutiveRef = doc(db, 'announcements', id);
      const docSnapshot = await getDoc(consecutiveRef);
      
      if (!docSnapshot.exists()) {
        console.log(`❌ Documento ${i + 1} não encontrado (possível problema de sincronização)`);
        continue;
      }
      
      await deleteDoc(consecutiveRef);
      
      // Verificar imediatamente
      const immediateCheck = await getDoc(consecutiveRef);
      console.log(`Documento ${i + 1} existe imediatamente após exclusão:`, immediateCheck.exists());
      
      // Aguardar e verificar novamente
      await new Promise(resolve => setTimeout(resolve, 200));
      const delayedCheck = await getDoc(consecutiveRef);
      console.log(`Documento ${i + 1} existe após delay:`, delayedCheck.exists());
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
  }
}

testFrontendDeletion().then(() => {
  console.log('\n✅ Teste do frontend concluído');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});