const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function clearAuthorizedUsers() {
  try {
    console.log('🗑️ Limpando coleção authorizedUsers...');
    
    const snapshot = await db.collection('authorizedUsers').get();
    
    if (snapshot.empty) {
      console.log('✅ Coleção authorizedUsers já está vazia');
      return;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ ${snapshot.size} usuários removidos da coleção authorizedUsers\n`);
    
  } catch (error) {
    console.error('❌ Erro ao limpar authorizedUsers:', error);
    throw error;
  }
}

async function migrateLeadershipUsers() {
  try {
    console.log('📋 Migrando usuários de authorizedleadership para authorizedUsers...');
    
    const snapshot = await db.collection('authorizedleadership').get();
    
    if (snapshot.empty) {
      console.log('❌ Nenhum usuário encontrado na coleção authorizedleadership');
      return;
    }
    
    const batch = db.batch();
    let migratedCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Filtrar apenas usuários com firebaseUid válido
      if (data.firebaseUid && data.firebaseUid !== 'N/A') {
        const newUserRef = db.collection('authorizedUsers').doc();
        
        // Mapear dados para o formato esperado
        const userData = {
          displayName: data.name || data.displayName || 'Usuário',
          email: data.email,
          role: data.role.toLowerCase(), // Normalizar role para minúsculo
          firebaseUid: data.firebaseUid,
          status: data.status || 'active',
          createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Adicionar campos opcionais se existirem
        if (data.phone) userData.phone = data.phone;
        if (data.avatarUrl) userData.avatarUrl = data.avatarUrl;
        if (data.isProtected) userData.isProtected = data.isProtected;
        
        batch.set(newUserRef, userData);
        migratedCount++;
        
        console.log(`📝 Migrando: ${userData.email} (${userData.role})`);
      } else {
        console.log(`⚠️ Pulando usuário sem firebaseUid: ${data.email}`);
      }
    });
    
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`\n✅ ${migratedCount} usuários migrados com sucesso!`);
    } else {
      console.log('\n❌ Nenhum usuário válido para migrar');
    }
    
  } catch (error) {
    console.error('❌ Erro ao migrar usuários:', error);
    throw error;
  }
}

async function main() {
  try {
    await clearAuthorizedUsers();
    await migrateLeadershipUsers();
    console.log('\n🎉 Migração concluída com sucesso!');
  } catch (error) {
    console.error('\n💥 Erro durante a migração:', error);
    process.exit(1);
  }
}

main().then(() => {
  process.exit(0);
});