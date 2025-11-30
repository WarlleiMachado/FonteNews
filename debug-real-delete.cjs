const admin = require('firebase-admin');
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();

async function debugRealDelete() {
  console.log('🔍 Debug de exclusão em tempo real...\n');

  try {
    // 1. Listar documentos existentes em cada coleção
    console.log('📋 1. Listando documentos existentes:');
    
    const collections = ['announcements', 'roteiros', 'cultos'];
    
    for (const collectionName of collections) {
      console.log(`\n   📁 Coleção: ${collectionName}`);
      const snapshot = await db.collection(collectionName).limit(5).get();
      
      if (snapshot.empty) {
        console.log('   📄 Nenhum documento encontrado');
      } else {
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   📄 ${index + 1}. ID: ${doc.id}`);
          console.log(`      Título: ${data.title || 'N/A'}`);
          console.log(`      Autor: ${data.authorFirebaseUid || data.authorId || 'N/A'}`);
          console.log(`      Status: ${data.status || 'N/A'}`);
        });
      }
    }

    // 2. Criar documento de teste para cada coleção
    console.log('\n📝 2. Criando documentos de teste:');
    
    const testDocs = {};
    
    // Anúncio
    const announcementData = {
      title: 'TESTE DEBUG - Anúncio',
      content: 'Teste de debug para exclusão',
      status: 'approved',
      authorId: '8COwk6X80udVGdGuqS2Q',
      authorFirebaseUid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1',
      createdAt: admin.firestore.Timestamp.now()
    };
    
    const announcementRef = await db.collection('announcements').add(announcementData);
    testDocs.announcement = announcementRef.id;
    console.log(`   ✅ Anúncio criado: ${announcementRef.id}`);

    // Roteiro
    const roteiroData = {
      title: 'TESTE DEBUG - Roteiro',
      content: 'Teste de debug para exclusão',
      status: 'rascunho',
      authorId: '8COwk6X80udVGdGuqS2Q',
      authorFirebaseUid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      history: []
    };
    
    const roteiroRef = await db.collection('roteiros').add(roteiroData);
    testDocs.roteiro = roteiroRef.id;
    console.log(`   ✅ Roteiro criado: ${roteiroRef.id}`);

    // Culto
    const cultoData = {
      title: 'TESTE DEBUG - Culto',
      content: 'Teste de debug para exclusão',
      status: 'approved',
      authorId: '8COwk6X80udVGdGuqS2Q',
      authorFirebaseUid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1',
      date: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now()
    };
    
    const cultoRef = await db.collection('cultos').add(cultoData);
    testDocs.culto = cultoRef.id;
    console.log(`   ✅ Culto criado: ${cultoRef.id}`);

    // 3. Simular processo de exclusão detalhado
    console.log('\n🔍 3. Simulando processo de exclusão detalhado:');
    
    for (const [type, docId] of Object.entries(testDocs)) {
      console.log(`\n   🗑️ Testando exclusão de ${type}: ${docId}`);
      
      const collectionName = type === 'roteiro' ? 'roteiros' : 
                           type === 'announcement' ? 'announcements' : 'cultos';
      
      try {
        // Passo 1: Verificar existência (como no frontend)
        console.log(`   🔍 Passo 1: Verificando existência...`);
        const docRef = db.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
          console.log(`   ❌ ERRO: Documento não existe (seria o erro do frontend)`);
          continue;
        }
        
        console.log(`   ✅ Documento existe`);
        console.log(`   📄 Dados: ${JSON.stringify(docSnap.data(), null, 2)}`);
        
        // Passo 2: Executar exclusão
        console.log(`   🗑️ Passo 2: Executando deleteDoc...`);
        await docRef.delete();
        console.log(`   ✅ deleteDoc executado sem erro`);
        
        // Passo 3: Verificação imediata
        console.log(`   🔍 Passo 3: Verificação imediata...`);
        const checkDoc = await docRef.get();
        
        if (!checkDoc.exists) {
          console.log(`   ✅ SUCESSO: Documento foi excluído`);
        } else {
          console.log(`   ❌ PROBLEMA: Documento ainda existe`);
          console.log(`   📄 Dados restantes: ${JSON.stringify(checkDoc.data(), null, 2)}`);
        }
        
        // Passo 4: Verificação com delay
        console.log(`   ⏳ Passo 4: Aguardando 1 segundo e verificando...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalCheck = await docRef.get();
        if (!finalCheck.exists) {
          console.log(`   ✅ CONFIRMADO: Documento definitivamente excluído`);
        } else {
          console.log(`   ❌ PERSISTENTE: Documento ainda existe após delay`);
        }
        
      } catch (error) {
        console.log(`   ❌ ERRO durante exclusão de ${type}:`, error.message);
        console.log(`   🔍 Código do erro:`, error.code);
      }
    }

    // 4. Testar exclusão consecutiva (problema relatado pelo usuário)
    console.log('\n🔄 4. Testando exclusão consecutiva (problema do usuário):');
    
    // Criar múltiplos roteiros
    const multipleRoteiros = [];
    for (let i = 1; i <= 3; i++) {
      const data = {
        ...roteiroData,
        title: `TESTE CONSECUTIVO - Roteiro ${i}`
      };
      
      const ref = await db.collection('roteiros').add(data);
      multipleRoteiros.push(ref.id);
      console.log(`   📝 Roteiro ${i} criado: ${ref.id}`);
    }
    
    // Tentar excluir um por vez (simulando comportamento do usuário)
    for (let i = 0; i < multipleRoteiros.length; i++) {
      const docId = multipleRoteiros[i];
      console.log(`\n   🗑️ Tentativa ${i + 1}: Excluindo ${docId}`);
      
      try {
        // Simular exatamente o que o frontend faz
        const docRef = db.collection('roteiros').doc(docId);
        
        // Verificação de existência
        const exists = await docRef.get();
        if (!exists.exists) {
          console.log(`   ❌ Documento ${i + 1} não existe (erro que aparece no frontend)`);
          continue;
        }
        
        console.log(`   ✅ Documento ${i + 1} existe, prosseguindo com exclusão`);
        
        // Exclusão
        await docRef.delete();
        console.log(`   ✅ Documento ${i + 1} excluído`);
        
        // Verificação
        const check = await docRef.get();
        if (!check.exists) {
          console.log(`   ✅ Documento ${i + 1} confirmado como excluído`);
        } else {
          console.log(`   ❌ Documento ${i + 1} ainda existe (problema!)`);
        }
        
        // Pequeno delay entre exclusões
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ ERRO na tentativa ${i + 1}:`, error.message);
        console.log(`   🔍 Código:`, error.code);
      }
    }

    // 5. Verificar estado final
    console.log('\n📊 5. Estado final das coleções:');
    
    for (const collectionName of collections) {
      console.log(`\n   📁 ${collectionName}:`);
      const snapshot = await db.collection(collectionName)
        .where('title', '>=', 'TESTE')
        .where('title', '<=', 'TESTE\uf8ff')
        .get();
      
      if (snapshot.empty) {
        console.log('   ✅ Nenhum documento de teste restante');
      } else {
        console.log(`   ⚠️ ${snapshot.size} documento(s) de teste ainda existem:`);
        snapshot.docs.forEach(doc => {
          console.log(`      - ${doc.id}: ${doc.data().title}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

// Executar debug
debugRealDelete()
  .then(() => {
    console.log('\n✅ Debug concluído');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal no debug:', error);
    process.exit(1);
  });