const admin = require('firebase-admin');
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function testDeleteOperations() {
  console.log('🧪 Testando operações de exclusão no Firestore...\n');

  try {
    // 1. Listar documentos na coleção roteiros
    console.log('📋 1. Listando documentos na coleção "roteiros":');
    const roteirosSnapshot = await db.collection('roteiros').get();
    console.log(`   Total de roteiros: ${roteirosSnapshot.size}`);
    
    roteirosSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ID: ${doc.id}`);
      console.log(`     Título: ${data.title || 'Sem título'}`);
      console.log(`     Autor: ${data.authorId || 'Sem autor'}`);
      console.log(`     Status: ${data.status || 'Sem status'}`);
    });

    // 2. Listar documentos na coleção announcements
    console.log('\n📋 2. Listando documentos na coleção "announcements":');
    const announcementsSnapshot = await db.collection('announcements').get();
    console.log(`   Total de anúncios: ${announcementsSnapshot.size}`);
    
    announcementsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ID: ${doc.id}`);
      console.log(`     Título: ${data.title || 'Sem título'}`);
      console.log(`     Autor: ${data.authorId || 'Sem autor'}`);
      console.log(`     Status: ${data.status || 'Sem status'}`);
    });

    // 3. Verificar usuários autorizados e seus claims
    console.log('\n👥 3. Verificando usuários autorizados:');
    const usersSnapshot = await db.collection('authorizedUsers').get();
    console.log(`   Total de usuários autorizados: ${usersSnapshot.size}`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      console.log(`   - ID: ${userDoc.id}`);
      console.log(`     Nome: ${userData.name || 'Sem nome'}`);
      console.log(`     Email: ${userData.email || 'Sem email'}`);
      console.log(`     Role: ${userData.role || 'Sem role'}`);
      console.log(`     Firebase UID: ${userData.firebaseUid || 'Sem UID'}`);
      
      // Verificar custom claims se tiver firebaseUid
      if (userData.firebaseUid) {
        try {
          const userRecord = await admin.auth().getUser(userData.firebaseUid);
          console.log(`     Custom Claims:`, userRecord.customClaims || 'Nenhum');
        } catch (error) {
          console.log(`     Erro ao buscar claims: ${error.message}`);
        }
      }
    }

    // 4. Testar regras de segurança simulando diferentes usuários
    console.log('\n🔐 4. Testando regras de segurança:');
    
    // Simular tentativa de exclusão com diferentes contextos
    const testCases = [
      { description: 'Admin com email fontedevidalaranjeiras@gmail.com', email: 'fontedevidalaranjeiras@gmail.com', admin: true },
      { description: 'Admin com email secretaria.adfdevidalaranjeiras@gmail.com', email: 'secretaria.adfdevidalaranjeiras@gmail.com', admin: true },
      { description: 'Usuário comum', email: 'usuario@teste.com', admin: false }
    ];

    for (const testCase of testCases) {
      console.log(`\n   Testando: ${testCase.description}`);
      
      // Criar token customizado para teste
      const customToken = await admin.auth().createCustomToken('test-uid', {
        admin: testCase.admin,
        email: testCase.email
      });
      
      console.log(`   Token criado para: ${testCase.email} (admin: ${testCase.admin})`);
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
testDeleteOperations()
  .then(() => {
    console.log('\n✅ Testes concluídos');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });