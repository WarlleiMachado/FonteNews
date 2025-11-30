const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, onSnapshot } = require('firebase/firestore');

// Configuração do Firebase Admin
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

// Configuração do Firebase Client
const firebaseConfig = {
  apiKey: "AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM",
  authDomain: "fontenews-877a3.firebaseapp.com",
  projectId: "fontenews-877a3",
  storageBucket: "fontenews-877a3.firebasestorage.app",
  messagingSenderId: "920658565832",
  appId: "1:920658565832:web:33f3aea58c6a9377f4e3fd",
  measurementId: "G-6C8W88C3XN"
};

const clientApp = initializeApp(firebaseConfig);
const db = getFirestore(clientApp);

console.log('🔍 Testando listener de scripts...');

// Configurar listener
const unsubscribe = onSnapshot(collection(db, 'scripts'), (snapshot) => {
  console.log('📡 Listener ativado! Documentos encontrados:', snapshot.docs.length);
  
  snapshot.docs.forEach(doc => {
    console.log(`- ID: ${doc.id}, Título: ${doc.data().title || 'Sem título'}`);
  });
  
  // Verificar mudanças
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      console.log('✅ Documento adicionado:', change.doc.id);
    }
    if (change.type === 'modified') {
      console.log('🔄 Documento modificado:', change.doc.id);
    }
    if (change.type === 'removed') {
      console.log('🗑️ Documento removido:', change.doc.id);
    }
  });
}, (error) => {
  console.error('❌ Erro no listener:', error);
});

console.log('⏳ Aguardando mudanças por 30 segundos...');

// Aguardar 30 segundos e depois parar
setTimeout(() => {
  console.log('⏹️ Parando listener...');
  unsubscribe();
  process.exit(0);
}, 30000);