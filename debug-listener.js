const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function testListener() {
  console.log('🔍 Testando listener onSnapshot para scripts...');
  
  // Listar documentos atuais
  const snapshot = await db.collection('scripts').get();
  console.log(`📊 Total de scripts no Firestore: ${snapshot.docs.length}`);
  
  snapshot.docs.forEach(doc => {
    console.log(`📄 Script ID: ${doc.id}, Title: ${doc.data().title}`);
  });
  
  // Criar um listener para mudanças
  const unsubscribe = db.collection('scripts').onSnapshot((snapshot) => {
    console.log('🔄 Listener ativado! Mudanças detectadas:');
    console.log(`📊 Total de scripts após mudança: ${snapshot.docs.length}`);
    
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('➕ Script adicionado:', change.doc.id);
      }
      if (change.type === 'modified') {
        console.log('✏️ Script modificado:', change.doc.id);
      }
      if (change.type === 'removed') {
        console.log('🗑️ Script removido:', change.doc.id);
      }
    });
  });
  
  console.log('👂 Listener ativo. Aguardando mudanças...');
  
  // Manter o script rodando por 30 segundos
  setTimeout(() => {
    console.log('⏰ Tempo esgotado. Finalizando listener...');
    unsubscribe();
    process.exit(0);
  }, 30000);
}

testListener().catch(console.error);