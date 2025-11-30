const admin = require('firebase-admin');
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function testSpecificDelete() {
  console.log('🧪 Testando exclusão específica...\n');

  try {
    // 1. Criar um documento de teste na coleção roteiros
    console.log('📝 1. Criando documento de teste na coleção "roteiros":');
    
    const testRoteiroData = {
      title: 'TESTE - Roteiro para exclusão',
      content: 'Este é um roteiro de teste que será excluído',
      status: 'rascunho',
      authorId: '8COwk6X80udVGdGuqS2Q', // ID do usuário admin (Secretaria ADF)
      authorFirebaseUid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1', // Firebase UID do admin
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      history: []
    };

    const docRef = await db.collection('roteiros').add(testRoteiroData);
    console.log(`   ✅ Documento criado com ID: ${docRef.id}`);

    // 2. Verificar se o documento foi criado
    console.log('\n🔍 2. Verificando se o documento foi criado:');
    const createdDoc = await db.collection('roteiros').doc(docRef.id).get();
    if (createdDoc.exists) {
      console.log('   ✅ Documento existe no Firestore');
      console.log('   📄 Dados:', createdDoc.data());
    } else {
      console.log('   ❌ Documento não foi encontrado');
      return;
    }

    // 3. Tentar excluir o documento usando Admin SDK
    console.log('\n🗑️ 3. Tentando excluir o documento usando Admin SDK:');
    await db.collection('roteiros').doc(docRef.id).delete();
    console.log('   ✅ Comando de exclusão executado');

    // 4. Verificar se foi realmente excluído
    console.log('\n🔍 4. Verificando se o documento foi excluído:');
    const deletedDoc = await db.collection('roteiros').doc(docRef.id).get();
    if (!deletedDoc.exists) {
      console.log('   ✅ Documento foi excluído com sucesso');
    } else {
      console.log('   ❌ Documento ainda existe após exclusão');
      console.log('   📄 Dados:', deletedDoc.data());
    }

    // 5. Testar exclusão de anúncio também
    console.log('\n📝 5. Testando exclusão de anúncio:');
    
    const testAnnouncementData = {
      title: 'TESTE - Anúncio para exclusão',
      content: 'Este é um anúncio de teste que será excluído',
      status: 'approved',
      authorId: '8COwk6X80udVGdGuqS2Q',
      authorFirebaseUid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1',
      createdAt: admin.firestore.Timestamp.now()
    };

    const announcementRef = await db.collection('announcements').add(testAnnouncementData);
    console.log(`   ✅ Anúncio criado com ID: ${announcementRef.id}`);

    // Excluir anúncio
    await db.collection('announcements').doc(announcementRef.id).delete();
    console.log('   ✅ Comando de exclusão de anúncio executado');

    // Verificar exclusão
    const deletedAnnouncement = await db.collection('announcements').doc(announcementRef.id).get();
    if (!deletedAnnouncement.exists) {
      console.log('   ✅ Anúncio foi excluído com sucesso');
    } else {
      console.log('   ❌ Anúncio ainda existe após exclusão');
    }

    // 6. Verificar regras de segurança simulando contexto do cliente
    console.log('\n🔐 6. Testando regras de segurança:');
    
    // Criar outro documento para testar regras
    const testDoc2Ref = await db.collection('roteiros').add({
      ...testRoteiroData,
      title: 'TESTE - Para regras de segurança'
    });
    
    console.log(`   📝 Documento criado para teste de regras: ${testDoc2Ref.id}`);
    
    // Simular diferentes contextos de usuário
    const testContexts = [
      {
        name: 'Admin com custom claim',
        uid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1',
        email: 'secretaria.adfdevidalaranjeiras@gmail.com',
        claims: { admin: true }
      },
      {
        name: 'Admin por email',
        uid: '3lhdKt9Jxtb5hbu3fDRusi0Hs6X2',
        email: 'fontedevidalaranjeiras@gmail.com',
        claims: { admin: true }
      },
      {
        name: 'Usuário sem admin claim',
        uid: '3atWn0a9q1WYuKaKReU0xuBdMJ43',
        email: 'machado.warllei@gmail.com',
        claims: {}
      }
    ];

    for (const context of testContexts) {
      console.log(`\n   Testando contexto: ${context.name}`);
      console.log(`   - UID: ${context.uid}`);
      console.log(`   - Email: ${context.email}`);
      console.log(`   - Claims: ${JSON.stringify(context.claims)}`);
      
      // Verificar se o usuário deveria ter permissão
      const shouldHavePermission = context.claims.admin === true || 
        ['fontedevidalaranjeiras@gmail.com', 'secretaria.adfdevidalaranjeiras@gmail.com'].includes(context.email);
      
      console.log(`   - Deveria ter permissão: ${shouldHavePermission}`);
    }

    // Limpar documento de teste
    await db.collection('roteiros').doc(testDoc2Ref.id).delete();
    console.log('\n🧹 Documento de teste limpo');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testSpecificDelete()
  .then(() => {
    console.log('\n✅ Teste específico concluído');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });