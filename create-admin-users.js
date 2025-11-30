const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

async function createAdminUsers() {
  const users = [
    {
      email: 'secretaria.adfdevidalaranjeiras@gmail.com',
      password: 'Admin123!',
      displayName: 'Secretaria ADF',
      emailVerified: true
    },
    {
      email: 'fontedevidalaranjeiras@gmail.com', 
      password: 'Admin123!',
      displayName: 'Fonte de Vida',
      emailVerified: true
    }
  ];

  for (const userData of users) {
    try {
      const userRecord = await admin.auth().createUser(userData);
      console.log(`Usuário criado com sucesso: ${userRecord.email} (UID: ${userRecord.uid})`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`Usuário já existe: ${userData.email}`);
      } else {
        console.error(`Erro ao criar usuário ${userData.email}:`, error.message);
      }
    }
  }
}

createAdminUsers()
  .then(() => {
    console.log('Processo concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro:', error);
    process.exit(1);
  });