const admin = require('firebase-admin');

// Configuração do Firebase Admin
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function testDeleteScript() {
  try {
    console.log('🔍 Listando roteiros existentes...');
    
    // Listar todos os scripts
    const scriptsSnapshot = await db.collection('scripts').get();
    console.log(`📋 Total de roteiros encontrados: ${scriptsSnapshot.size}`);
    
    if (scriptsSnapshot.size === 0) {
      console.log('❌ Nenhum roteiro encontrado para testar exclusão');
      return;
    }
    
    // Pegar o primeiro script para teste
    const firstScript = scriptsSnapshot.docs[0];
    const scriptId = firstScript.id;
    const scriptData = firstScript.data();
    
    console.log(`🎯 Testando exclusão do roteiro: ${scriptId}`);
    console.log(`📝 Título: ${scriptData.title}`);
    
    // Tentar excluir
    await db.collection('scripts').doc(scriptId).delete();
    console.log('✅ Exclusão executada com sucesso');
    
    // Verificar se foi realmente excluído
    const deletedDoc = await db.collection('scripts').doc(scriptId).get();
    if (!deletedDoc.exists) {
      console.log('✅ Confirmado: Roteiro foi excluído do Firestore');
    } else {
      console.log('❌ ERRO: Roteiro ainda existe no Firestore após exclusão');
    }
    
    // Listar novamente para confirmar
    const scriptsAfter = await db.collection('scripts').get();
    console.log(`📋 Total de roteiros após exclusão: ${scriptsAfter.size}`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
  }
}

testDeleteScript().then(() => {
  console.log('🏁 Teste concluído');
  process.exit(0);
});