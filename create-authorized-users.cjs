const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function createAuthorizedUsers() {
  console.log('🔄 Criando usuários autorizados no Firestore...');
  
  // Primeiro, vamos buscar os usuários do Firebase Auth
  const listUsersResult = await admin.auth().listUsers();
  console.log('👥 Usuários encontrados no Firebase Auth:', listUsersResult.users.length);
  
  const authorizedUsers = [
    {
      id: 'admin-secretaria',
      name: 'Secretaria ADF',
      email: 'secretaria.adfdevidalaranjeiras@gmail.com',
      role: 'admin',
      phone: '',
      password: 'Admin123!',
      avatarUrl: '',
      status: 'active',
      createdAt: admin.firestore.Timestamp.now(),
      isProtected: true,
      ministry: 'Secretaria',
      firebaseUid: null // Será preenchido automaticamente
    },
    {
      id: 'admin-fonte',
      name: 'Fonte de Vida',
      email: 'fontedevidalaranjeiras@gmail.com',
      role: 'admin',
      phone: '',
      password: 'Admin123!',
      avatarUrl: '',
      status: 'active',
      createdAt: admin.firestore.Timestamp.now(),
      isProtected: true,
      ministry: 'Liderança',
      firebaseUid: null // Será preenchido automaticamente
    }
  ];

  for (const userData of authorizedUsers) {
    try {
      // Buscar o UID do Firebase Auth correspondente
      const authUser = listUsersResult.users.find(u => u.email === userData.email);
      if (authUser) {
        userData.firebaseUid = authUser.uid;
        console.log(`✅ Firebase UID encontrado para ${userData.email}: ${authUser.uid}`);
      } else {
        console.log(`⚠️ Firebase UID não encontrado para ${userData.email}`);
      }
      
      // Criar documento na coleção authorizedUsers
      await db.collection('authorizedUsers').doc(userData.id).set(userData);
      console.log(`✅ Usuário autorizado criado: ${userData.name} (${userData.email})`);
      
    } catch (error) {
      console.error(`❌ Erro ao criar usuário autorizado ${userData.email}:`, error.message);
    }
  }
}

createAuthorizedUsers()
  .then(() => {
    console.log('✅ Processo de criação de usuários autorizados concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });