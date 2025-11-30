const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function checkLeadershipUsers() {
  try {
    console.log('🔍 Verificando usuários na coleção authorizedleadership...\n');
    
    const snapshot = await db.collection('authorizedleadership').get();
    
    if (snapshot.empty) {
      console.log('❌ Nenhum usuário encontrado na coleção authorizedleadership');
      return;
    }
    
    console.log(`📊 Total de usuários na authorizedleadership: ${snapshot.size}\n`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}`);
      console.log(`   Nome: ${data.displayName || 'N/A'}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   Role: ${data.role || 'N/A'}`);
      console.log(`   Firebase UID: ${data.firebaseUid || 'N/A'}`);
      console.log(`   Campos disponíveis: ${Object.keys(data).join(', ')}\n`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error);
  }
}

checkLeadershipUsers().then(() => {
  console.log('✅ Verificação concluída');
  process.exit(0);
});