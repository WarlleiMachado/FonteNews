import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

// Configuração do Firebase (mesma do app)
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
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🔍 Testando autenticação com Client SDK...');

// Função para aguardar autenticação
function waitForAuth() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout na autenticação'));
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

async function testClientAuth() {
  try {
    console.log('🔐 Fazendo login com credenciais de admin...');
    
    // Usar credenciais do usuário admin que sabemos que existe
    const email = 'fontedevidalaranjeiras@gmail.com';
    const password = 'FonteVida2024!'; // Senha padrão que foi definida
    
    // Fazer login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', userCredential.user.email);
    console.log('🆔 UID:', userCredential.user.uid);
    
    // Aguardar o estado de autenticação ser processado
    await waitForAuth();
    
    // Obter token de ID para verificar claims
    const tokenResult = await userCredential.user.getIdTokenResult();
    console.log('🎫 Custom claims:', tokenResult.claims);
    
    // Verificar se tem claims de admin
    if (tokenResult.claims.admin) {
      console.log('✅ Usuário tem claims de administrador');
    } else {
      console.log('❌ Usuário NÃO tem claims de administrador');
    }
    
    // Testar criação de documento
    console.log('📝 Criando documento de teste...');
    const testDoc = {
      title: 'Teste Client Auth',
      content: 'Documento criado durante teste de autenticação do cliente',
      authorId: userCredential.user.uid,
      authorEmail: userCredential.user.email,
      createdAt: serverTimestamp(),
      published: true
    };
    
    const docRef = await addDoc(collection(db, 'announcements'), testDoc);
    console.log('✅ Documento criado com ID:', docRef.id);
    
    // Verificar se o documento foi criado
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log('✅ Documento confirmado no Firestore');
      console.log('📄 Dados:', docSnap.data());
    } else {
      console.log('❌ Documento não encontrado após criação');
    }
    
    // Aguardar um pouco antes de tentar deletar
    console.log('⏳ Aguardando 1 segundo antes de deletar...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Testar exclusão
    console.log('🗑️ Tentando deletar documento...');
    await deleteDoc(docRef);
    console.log('✅ Comando de exclusão executado');
    
    // Aguardar um pouco antes de verificar
    console.log('⏳ Aguardando 500ms antes de verificar exclusão...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se foi deletado
    const deletedDocSnap = await getDoc(docRef);
    if (!deletedDocSnap.exists()) {
      console.log('✅ Documento deletado com sucesso');
    } else {
      console.log('❌ Documento ainda existe após exclusão');
      console.log('📄 Dados restantes:', deletedDocSnap.data());
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    console.log('Código do erro:', error.code);
    console.log('Mensagem:', error.message);
    
    if (error.code === 'auth/invalid-credential') {
      console.log('💡 Dica: Credenciais inválidas - tentando com senha alternativa...');
      
      // Tentar com senha alternativa
      try {
        console.log('🔐 Tentando com senha alternativa...');
        const userCredential = await signInWithEmailAndPassword(auth, 'fontedevidalaranjeiras@gmail.com', 'Admin123!');
        console.log('✅ Login com senha alternativa realizado com sucesso');
        
        // Repetir teste com login bem-sucedido
        const tokenResult = await userCredential.user.getIdTokenResult();
        console.log('🎫 Custom claims:', tokenResult.claims);
        
        // Testar criação rápida
        const testDoc = {
          title: 'Teste Client Auth Alt',
          content: 'Documento criado com senha alternativa',
          authorId: userCredential.user.uid,
          authorEmail: userCredential.user.email,
          createdAt: serverTimestamp(),
          published: true
        };
        
        const docRef = await addDoc(collection(db, 'announcements'), testDoc);
        console.log('✅ Documento criado com ID:', docRef.id);
        
        // Deletar imediatamente
        await deleteDoc(docRef);
        console.log('✅ Documento deletado');
        
      } catch (altError) {
        console.error('❌ Erro com senha alternativa:', altError.code);
      }
      
    } else if (error.code === 'permission-denied') {
      console.log('💡 Dica: Problema com regras de segurança do Firestore');
    }
  }
}

// Executar teste
testClientAuth().then(() => {
  console.log('✅ Teste de autenticação do cliente concluído');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});