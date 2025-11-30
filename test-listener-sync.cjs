const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function testListenerSync() {
  console.log('🧪 Testando sincronização de listeners...');
  
  // 1. Criar um documento de teste
  const testDoc = {
    title: 'Teste de Sincronização',
    content: 'Este é um documento de teste para verificar listeners',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    author: 'Sistema de Teste',
    authorId: 'test-user'
  };
  
  console.log('📝 Criando documento de teste...');
  const docRef = await db.collection('scripts').add(testDoc);
  console.log('✅ Documento criado com ID:', docRef.id);
  
  // 2. Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 3. Configurar listener para detectar mudanças
  console.log('👂 Configurando listener...');
  const unsubscribe = db.collection('scripts').onSnapshot((snapshot) => {
    console.log('🔄 Listener ativado! Total de documentos:', snapshot.docs.length);
    
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('➕ Documento adicionado:', change.doc.id, change.doc.data().title);
      }
      if (change.type === 'modified') {
        console.log('✏️ Documento modificado:', change.doc.id, change.doc.data().title);
      }
      if (change.type === 'removed') {
        console.log('🗑️ Documento removido:', change.doc.id);
      }
    });
  });
  
  // 4. Aguardar um pouco para o listener se estabelecer
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 5. Deletar o documento de teste
  console.log('🗑️ Deletando documento de teste...');
  await db.collection('scripts').doc(docRef.id).delete();
  console.log('✅ Documento deletado');
  
  // 6. Aguardar para ver se o listener detecta a remoção
  console.log('⏳ Aguardando listener detectar a remoção...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // 7. Finalizar
  console.log('🏁 Teste finalizado');
  unsubscribe();
  process.exit(0);
}

testListenerSync().catch(console.error);