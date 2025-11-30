const admin = require('firebase-admin');
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function migrateToRoteiros() {
  console.log('🔄 Migrando dados para a coleção "roteiros"...\n');

  try {
    // Get all scripts
    const scriptsSnapshot = await db.collection('scripts').get();
    console.log(`📝 Encontrados ${scriptsSnapshot.size} documentos na coleção "scripts"`);

    if (scriptsSnapshot.size === 0) {
      console.log('❌ Nenhum documento encontrado para migrar.');
      return;
    }

    const batch = db.batch();
    let migratedCount = 0;

    for (const doc of scriptsSnapshot.docs) {
      const data = doc.data();
      
      // Skip if it's clearly an announcement (has type field)
      if (data.type && ['aviso', 'evento', 'retiro', 'jantar', 'visita', 'evangelismo', 'audicao', 'curso', 'confraternizacao', 'jornada-vida'].includes(data.type)) {
        console.log(`⏭️  Pulando documento ${doc.id} (é um anúncio)`);
        continue;
      }

      // Create properly structured roteiro document
      const roteiroData = {
        id: doc.id,
        title: data.title || 'Título não definido',
        content: data.content || '',
        status: data.status || 'rascunho',
        authorId: data.authorId || '',
        authorFirebaseUid: data.authorFirebaseUid || '',
        image: data.image || '',
        recordingMonth: data.recordingMonth || new Date().toISOString().slice(0, 7), // YYYY-MM format
        rruleString: data.rruleString || '',
        history: data.history || [],
        attachments: data.attachments || [],
        createdAt: data.createdAt || admin.firestore.Timestamp.now(),
        updatedAt: data.updatedAt || admin.firestore.Timestamp.now()
      };

      // Ensure dates are Firestore Timestamps
      if (!(roteiroData.createdAt instanceof admin.firestore.Timestamp)) {
        if (roteiroData.createdAt instanceof Date) {
          roteiroData.createdAt = admin.firestore.Timestamp.fromDate(roteiroData.createdAt);
        } else if (typeof roteiroData.createdAt === 'string') {
          roteiroData.createdAt = admin.firestore.Timestamp.fromDate(new Date(roteiroData.createdAt));
        } else {
          roteiroData.createdAt = admin.firestore.Timestamp.now();
        }
      }

      if (!(roteiroData.updatedAt instanceof admin.firestore.Timestamp)) {
        if (roteiroData.updatedAt instanceof Date) {
          roteiroData.updatedAt = admin.firestore.Timestamp.fromDate(roteiroData.updatedAt);
        } else if (typeof roteiroData.updatedAt === 'string') {
          roteiroData.updatedAt = admin.firestore.Timestamp.fromDate(new Date(roteiroData.updatedAt));
        } else {
          roteiroData.updatedAt = admin.firestore.Timestamp.now();
        }
      }

      // Add to roteiros collection
      const roteiroRef = db.collection('roteiros').doc(doc.id);
      batch.set(roteiroRef, roteiroData);
      
      console.log(`✅ Preparando migração: ${roteiroData.title} (${doc.id})`);
      migratedCount++;
    }

    // Commit the batch
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`\n🎉 Migração concluída! ${migratedCount} roteiros migrados para a coleção "roteiros"`);
      
      // Verify migration
      const roteirosSnapshot = await db.collection('roteiros').get();
      console.log(`✅ Verificação: ${roteirosSnapshot.size} documentos na coleção "roteiros"`);
      
      // Show first few migrated documents
      console.log('\n📋 Primeiros roteiros migrados:');
      roteirosSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ${data.title} - Status: ${data.status}`);
        console.log(`      CreatedAt: ${data.createdAt.toDate()}`);
        console.log(`      UpdatedAt: ${data.updatedAt.toDate()}`);
      });
    } else {
      console.log('❌ Nenhum roteiro válido encontrado para migrar.');
    }

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }

  process.exit(0);
}

migrateToRoteiros();