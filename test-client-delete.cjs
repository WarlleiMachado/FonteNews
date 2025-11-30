const { initializeApp } = require('firebase/app');
const { getFirestore, doc, deleteDoc, connectFirestoreEmulator } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Configuração do Firebase (mesma do frontend)
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

async function testClientDelete() {
  try {
    console.log('🔐 Fazendo login como secretaria...');
    
    // Fazer login
    const userCredential = await signInWithEmailAndPassword(auth, 'secretaria.adfdevidalaranjeiras@gmail.com', 'Fonte2024!');
    const user = userCredential.user;
    
    console.log('✅ Login realizado com sucesso');
    console.log('👤 UID:', user.uid);
    console.log('📧 Email:', user.email);
    
    // Obter o token para verificar claims
    const idTokenResult = await user.getIdTokenResult();
    console.log('🔐 Claims:', idTokenResult.claims);
    
    // Listar scripts disponíveis primeiro
    const admin = require('firebase-admin');
    const serviceAccount = require('./fontenews-877a3-485d38363783.json');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'fontenews-877a3'
      });
    }
    
    const adminDb = admin.firestore();
    const scriptsSnapshot = await adminDb.collection('scripts').get();
    
    if (scriptsSnapshot.size === 0) {
      console.log('❌ Nenhum script encontrado para testar');
      return;
    }
    
    const firstScript = scriptsSnapshot.docs[0];
    const scriptId = firstScript.id;
    const scriptData = firstScript.data();
    
    console.log(`🎯 Tentando excluir script: ${scriptId}`);
    console.log(`📝 Título: ${scriptData.title}`);
    
    // Tentar excluir usando o SDK do cliente (como o frontend faz)
    const docRef = doc(db, 'scripts', scriptId);
    await deleteDoc(docRef);
    
    console.log('✅ Exclusão executada com sucesso pelo cliente');
    
    // Verificar se foi realmente excluído
    const deletedDoc = await adminDb.collection('scripts').doc(scriptId).get();
    if (!deletedDoc.exists) {
      console.log('✅ Confirmado: Script foi excluído do Firestore');
    } else {
      console.log('❌ ERRO: Script ainda existe no Firestore após exclusão');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
  }
}

testClientDelete().then(() => {
  console.log('🏁 Teste concluído');
  process.exit(0);
});