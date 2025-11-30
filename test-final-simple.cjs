const admin = require('firebase-admin');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "fontenews-877a3"
  });
}

const db = admin.firestore();

async function testDeletion() {
  console.log('🔍 Testando processo de exclusão...\n');

  try {
    // 1. Criar documento de teste
    const testId = 'test-' + Date.now();
    const testDoc = {
      title: 'Teste de Exclusão',
      content: 'Documento para testar exclusão',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      authorId: 'test-user'
    };

    console.log('📝 Criando documento de teste...');
    await db.collection('announcements').doc(testId).set(testDoc);
    console.log('✅ Documento criado com ID:', testId);

    // 2. Verificar se existe
    console.log('\n🔍 Verificando existência antes da exclusão...');
    const beforeDelete = await db.collection('announcements').doc(testId).get();
    console.log('Existe antes da exclusão:', beforeDelete.exists);

    // 3. Simular processo de exclusão do frontend
    console.log('\n🗑️ Iniciando processo de exclusão...');
    
    // Verificar existência (como no frontend)
    const docRef = db.collection('announcements').doc(testId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      console.log('❌ Documento não encontrado antes da exclusão');
      return;
    }
    
    console.log('✅ Documento encontrado, prosseguindo com exclusão...');
    
    // Executar exclusão
    await docRef.delete();
    console.log('✅ Comando de exclusão executado');
    
    // Aguardar um pouco (como no código atualizado)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se foi realmente excluído
    const afterDelete = await docRef.get();
    console.log('Existe após exclusão:', afterDelete.exists);
    
    if (afterDelete.exists) {
      console.log('❌ PROBLEMA: Documento ainda existe após exclusão!');
    } else {
      console.log('✅ Documento excluído com sucesso');
    }

    // 4. Testar exclusão consecutiva (cenário do usuário)
    console.log('\n🔄 Testando exclusões consecutivas...');
    
    const testIds = [];
    for (let i = 0; i < 3; i++) {
      const id = `consecutive-test-${Date.now()}-${i}`;
      await db.collection('announcements').doc(id).set({
        title: `Teste Consecutivo ${i + 1}`,
        content: 'Teste de exclusão consecutiva',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      testIds.push(id);
      console.log(`📝 Criado documento ${i + 1}: ${id}`);
    }

    // Excluir todos rapidamente
    console.log('\n🗑️ Excluindo documentos consecutivamente...');
    for (let i = 0; i < testIds.length; i++) {
      const id = testIds[i];
      console.log(`Excluindo documento ${i + 1}...`);
      
      const docRef = db.collection('announcements').doc(id);
      const docSnapshot = await docRef.get();
      
      if (!docSnapshot.exists) {
        console.log(`❌ Documento ${i + 1} não encontrado (possível problema de sincronização)`);
        continue;
      }
      
      await docRef.delete();
      
      // Verificar imediatamente
      const immediateCheck = await docRef.get();
      console.log(`Documento ${i + 1} existe imediatamente após exclusão:`, immediateCheck.exists);
      
      // Aguardar e verificar novamente
      await new Promise(resolve => setTimeout(resolve, 200));
      const delayedCheck = await docRef.get();
      console.log(`Documento ${i + 1} existe após delay:`, delayedCheck.exists);
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testDeletion().then(() => {
  console.log('\n✅ Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});