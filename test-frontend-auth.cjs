const admin = require('firebase-admin');

// Configuração do Firebase Admin
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function testUserAuth() {
  try {
    console.log('🔍 Verificando usuário secretaria.adfdevidalaranjeiras@gmail.com...');
    
    // Buscar o usuário no Firebase Auth
    const userRecord = await admin.auth().getUserByEmail('secretaria.adfdevidalaranjeiras@gmail.com');
    console.log('👤 Usuário encontrado no Auth:', userRecord.uid);
    console.log('📧 Email:', userRecord.email);
    console.log('🔐 Custom claims:', userRecord.customClaims);
    
    // Verificar se tem claims de admin
    if (userRecord.customClaims && userRecord.customClaims.admin) {
      console.log('✅ Usuário tem claims de administrador');
    } else {
      console.log('❌ Usuário NÃO tem claims de administrador');
      
      // Definir claims de admin
      console.log('🔧 Definindo claims de administrador...');
      await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
      console.log('✅ Claims de administrador definidas');
      
      // Verificar novamente
      const updatedUser = await admin.auth().getUser(userRecord.uid);
      console.log('🔐 Claims atualizadas:', updatedUser.customClaims);
    }
    
    // Verificar se o usuário está na coleção authorizedUsers
    console.log('🔍 Verificando na coleção authorizedUsers...');
    const authUsersSnapshot = await db.collection('authorizedUsers').get();
    const authUser = authUsersSnapshot.docs.find(doc => {
      const data = doc.data();
      return data.email === 'secretaria.adfdevidalaranjeiras@gmail.com';
    });
    
    if (authUser) {
      console.log('✅ Usuário encontrado na coleção authorizedUsers');
      console.log('📋 Dados:', authUser.data());
    } else {
      console.log('❌ Usuário NÃO encontrado na coleção authorizedUsers');
    }
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

testUserAuth().then(() => {
  console.log('🏁 Verificação concluída');
  process.exit(0);
});