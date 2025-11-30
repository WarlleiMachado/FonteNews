const admin = require('firebase-admin');
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function checkCollections() {
  console.log('🔍 Verificando coleções no Firestore...\n');

  try {
    // Check scripts collection
    console.log('📝 Coleção "scripts":');
    const scriptsSnapshot = await db.collection('scripts').get();
    console.log(`   Total de documentos: ${scriptsSnapshot.size}`);
    
    if (scriptsSnapshot.size > 0) {
      console.log('   Primeiros 3 documentos:');
      scriptsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ID: ${doc.id}`);
        console.log(`      Título: ${data.title || 'N/A'}`);
        console.log(`      Status: ${data.status || 'N/A'}`);
        console.log(`      CreatedAt: ${data.createdAt ? (typeof data.createdAt === 'object' ? data.createdAt.toDate() : data.createdAt) : 'N/A'}`);
        console.log(`      UpdatedAt: ${data.updatedAt ? (typeof data.updatedAt === 'object' ? data.updatedAt.toDate() : data.updatedAt) : 'N/A'}`);
        console.log(`      Campos: ${Object.keys(data).join(', ')}`);
        console.log('');
      });
    }

    // Check roteiros collection
    console.log('📝 Coleção "roteiros":');
    const roteirosSnapshot = await db.collection('roteiros').get();
    console.log(`   Total de documentos: ${roteirosSnapshot.size}`);
    
    if (roteirosSnapshot.size > 0) {
      console.log('   Primeiros 3 documentos:');
      roteirosSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ID: ${doc.id}`);
        console.log(`      Título: ${data.title || 'N/A'}`);
        console.log(`      Status: ${data.status || 'N/A'}`);
        console.log(`      CreatedAt: ${data.createdAt ? (typeof data.createdAt === 'object' ? data.createdAt.toDate() : data.createdAt) : 'N/A'}`);
        console.log(`      UpdatedAt: ${data.updatedAt ? (typeof data.updatedAt === 'object' ? data.updatedAt.toDate() : data.updatedAt) : 'N/A'}`);
        console.log(`      Campos: ${Object.keys(data).join(', ')}`);
        console.log('');
      });
    }

    // Check announcements collection
    console.log('📢 Coleção "announcements":');
    const announcementsSnapshot = await db.collection('announcements').get();
    console.log(`   Total de documentos: ${announcementsSnapshot.size}`);

    // Check authorizedUsers collection
    console.log('👥 Coleção "authorizedUsers":');
    const usersSnapshot = await db.collection('authorizedUsers').get();
    console.log(`   Total de usuários: ${usersSnapshot.size}`);
    
    if (usersSnapshot.size > 0) {
      console.log('   Usuários autorizados:');
      usersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.name} (${data.email}) - Role: ${data.role}`);
      });
    }

    // List all collections
    console.log('\n📁 Todas as coleções disponíveis:');
    const collections = await db.listCollections();
    collections.forEach(collection => {
      console.log(`   - ${collection.id}`);
    });

  } catch (error) {
    console.error('❌ Erro ao verificar coleções:', error);
  }

  process.exit(0);
}

checkCollections();