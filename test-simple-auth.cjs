const admin = require('firebase-admin');

// Configuração do Firebase Admin
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();
const auth = admin.auth();

async function testSimpleAuth() {
  try {
    console.log('🔍 Verificando usuários existentes no Firebase Auth...');
    
    // Listar usuários existentes
    const listUsersResult = await auth.listUsers(10);
    console.log(`📊 Total de usuários encontrados: ${listUsersResult.users.length}`);
    
    for (const userRecord of listUsersResult.users) {
      console.log(`\n👤 Usuário: ${userRecord.email || 'Sem email'}`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email verificado: ${userRecord.emailVerified}`);
      console.log(`   Custom claims: ${JSON.stringify(userRecord.customClaims || {})}`);
      
      // Se for um dos emails admin, garantir que tem claims
      const adminEmails = [
        'fontedevidalaranjeiras@gmail.com',
        'secretaria.adfdevidalaranjeiras@gmail.com'
      ];
      
      if (userRecord.email && adminEmails.includes(userRecord.email)) {
        console.log('   🔧 Este é um email de admin');
        
        if (!userRecord.customClaims || !userRecord.customClaims.admin) {
          console.log('   ⚠️ Definindo custom claims de admin...');
          await auth.setCustomUserClaims(userRecord.uid, { admin: true });
          console.log('   ✅ Custom claims definidas');
        } else {
          console.log('   ✅ Já tem custom claims de admin');
        }
      }
    }
    
    // Testar criação de documento com admin SDK
    console.log('\n📝 Testando criação de documento com Admin SDK...');
    
    const testDoc = {
      title: 'Teste Admin SDK',
      content: 'Documento criado com Firebase Admin SDK',
      authorId: 'admin-test',
      authorEmail: 'admin@test.com',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      published: true
    };
    
    const docRef = await db.collection('announcements').add(testDoc);
    console.log('✅ Documento criado com ID:', docRef.id);
    
    // Verificar se foi criado
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      console.log('✅ Documento confirmado no Firestore');
    }
    
    // Deletar o documento de teste
    await docRef.delete();
    console.log('🗑️ Documento de teste deletado');
    
    // Verificar se foi deletado
    const deletedSnap = await docRef.get();
    if (!deletedSnap.exists) {
      console.log('✅ Documento deletado com sucesso');
    }
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testSimpleAuth().then(() => {
  console.log('\n🏁 Teste simples concluído');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});