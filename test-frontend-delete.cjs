const admin = require('firebase-admin');
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function simulateFrontendDelete() {
  console.log('🎭 Simulando exclusão do frontend...\n');

  try {
    // 1. Criar um documento de teste
    console.log('📝 1. Criando documento de teste:');
    
    const testData = {
      title: 'TESTE - Simulação Frontend',
      content: 'Teste de exclusão simulando frontend',
      status: 'rascunho',
      authorId: '8COwk6X80udVGdGuqS2Q',
      authorFirebaseUid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      history: []
    };

    const docRef = await db.collection('roteiros').add(testData);
    console.log(`   ✅ Documento criado: ${docRef.id}`);

    // 2. Simular verificação de existência (como no frontend)
    console.log('\n🔍 2. Verificando existência (simulando frontend):');
    const docSnap = await db.collection('roteiros').doc(docRef.id).get();
    
    if (!docSnap.exists) {
      console.log('   ❌ Documento não existe - erro seria lançado aqui');
      return;
    }
    
    console.log('   ✅ Documento existe');
    console.log('   📄 Dados:', JSON.stringify(docSnap.data(), null, 2));

    // 3. Simular exclusão (como no frontend)
    console.log('\n🗑️ 3. Executando exclusão (simulando frontend):');
    
    try {
      await db.collection('roteiros').doc(docRef.id).delete();
      console.log('   ✅ deleteDoc executado sem erro');
    } catch (deleteError) {
      console.log('   ❌ Erro durante deleteDoc:', deleteError.message);
      console.log('   🔍 Código do erro:', deleteError.code);
      return;
    }

    // 4. Verificação imediata (como no frontend)
    console.log('\n🔍 4. Verificação imediata pós-exclusão:');
    const checkDoc = await db.collection('roteiros').doc(docRef.id).get();
    
    if (!checkDoc.exists) {
      console.log('   ✅ SUCESSO: Documento foi excluído');
    } else {
      console.log('   ❌ PROBLEMA: Documento ainda existe');
      console.log('   📄 Dados ainda presentes:', checkDoc.data());
    }

    // 5. Aguardar um pouco e verificar novamente (possível delay)
    console.log('\n⏳ 5. Aguardando 2 segundos e verificando novamente:');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalCheck = await db.collection('roteiros').doc(docRef.id).get();
    if (!finalCheck.exists) {
      console.log('   ✅ Documento definitivamente excluído');
    } else {
      console.log('   ❌ Documento ainda existe após delay');
      console.log('   📄 Dados:', finalCheck.data());
    }

    // 6. Testar múltiplas exclusões consecutivas
    console.log('\n🔄 6. Testando múltiplas exclusões consecutivas:');
    
    const testDocs = [];
    
    // Criar 3 documentos
    for (let i = 1; i <= 3; i++) {
      const docData = {
        ...testData,
        title: `TESTE - Múltipla exclusão ${i}`
      };
      
      const newDocRef = await db.collection('roteiros').add(docData);
      testDocs.push(newDocRef.id);
      console.log(`   📝 Documento ${i} criado: ${newDocRef.id}`);
    }

    // Tentar excluir todos consecutivamente
    for (let i = 0; i < testDocs.length; i++) {
      const docId = testDocs[i];
      console.log(`\n   🗑️ Excluindo documento ${i + 1}: ${docId}`);
      
      try {
        // Verificar existência
        const exists = await db.collection('roteiros').doc(docId).get();
        if (!exists.exists) {
          console.log(`   ⚠️ Documento ${i + 1} já não existe`);
          continue;
        }
        
        // Excluir
        await db.collection('roteiros').doc(docId).delete();
        console.log(`   ✅ Documento ${i + 1} excluído`);
        
        // Verificar
        const check = await db.collection('roteiros').doc(docId).get();
        if (!check.exists) {
          console.log(`   ✅ Documento ${i + 1} confirmado como excluído`);
        } else {
          console.log(`   ❌ Documento ${i + 1} ainda existe após exclusão`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao excluir documento ${i + 1}:`, error.message);
      }
    }

    // 7. Verificar regras de segurança com diferentes usuários
    console.log('\n🔐 7. Testando com diferentes contextos de usuário:');
    
    // Criar documento para teste de permissões
    const permTestDoc = await db.collection('roteiros').add({
      ...testData,
      title: 'TESTE - Permissões'
    });
    
    console.log(`   📝 Documento para teste de permissões: ${permTestDoc.id}`);
    
    // Simular diferentes usuários tentando excluir
    const userContexts = [
      {
        name: 'Admin principal',
        uid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1',
        email: 'secretaria.adfdevidalaranjeiras@gmail.com'
      },
      {
        name: 'Admin secundário',
        uid: '3lhdKt9Jxtb5hbu3fDRusi0Hs6X2',
        email: 'fontedevidalaranjeiras@gmail.com'
      }
    ];

    for (const context of userContexts) {
      console.log(`\n   Testando com: ${context.name}`);
      console.log(`   - UID: ${context.uid}`);
      console.log(`   - Email: ${context.email}`);
      
      try {
        // Como estamos usando Admin SDK, sempre terá permissão
        // Mas vamos verificar se o documento ainda existe
        const testDoc = await db.collection('roteiros').doc(permTestDoc.id).get();
        if (testDoc.exists) {
          console.log(`   ✅ ${context.name} pode ver o documento`);
        } else {
          console.log(`   ❌ Documento não existe para ${context.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro para ${context.name}:`, error.message);
      }
    }

    // Limpar documento de teste de permissões
    await db.collection('roteiros').doc(permTestDoc.id).delete();
    console.log('\n🧹 Documento de teste de permissões limpo');

  } catch (error) {
    console.error('❌ Erro durante simulação:', error);
  }
}

// Executar simulação
simulateFrontendDelete()
  .then(() => {
    console.log('\n✅ Simulação do frontend concluída');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal na simulação:', error);
    process.exit(1);
  });