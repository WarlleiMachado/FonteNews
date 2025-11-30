const admin = require('firebase-admin');
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const db = admin.firestore();
const auth = admin.auth();

async function testFrontendAuthReal() {
  console.log('🔐 Testando autenticação real do frontend...\n');

  try {
    // 1. Verificar usuários autorizados
    console.log('👥 1. Verificando usuários autorizados:');
    const authorizedUsersSnapshot = await db.collection('authorizedUsers').get();
    
    if (authorizedUsersSnapshot.empty) {
      console.log('   ❌ Nenhum usuário autorizado encontrado');
      return;
    }

    const authorizedUsers = [];
    authorizedUsersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      authorizedUsers.push({
        id: doc.id,
        ...data
      });
      console.log(`   👤 ${data.name} (${data.email}) - Role: ${data.role} - Status: ${data.status}`);
    });

    // 2. Verificar usuários Firebase Auth
    console.log('\n🔥 2. Verificando usuários no Firebase Auth:');
    const listUsersResult = await auth.listUsers(10);
    
    listUsersResult.users.forEach(userRecord => {
      console.log(`   🔥 ${userRecord.email} - UID: ${userRecord.uid}`);
      if (userRecord.customClaims) {
        console.log(`      Claims: ${JSON.stringify(userRecord.customClaims)}`);
      } else {
        console.log('      Claims: Nenhum');
      }
    });

    // 3. Verificar correspondência entre usuários autorizados e Firebase Auth
    console.log('\n🔗 3. Verificando correspondência:');
    
    const adminUsers = authorizedUsers.filter(u => u.role === 'admin' && u.status === 'active');
    console.log(`   📊 Usuários admin ativos encontrados: ${adminUsers.length}`);
    
    for (const adminUser of adminUsers) {
      console.log(`\n   🔍 Verificando admin: ${adminUser.name} (${adminUser.email})`);
      
      try {
        // Buscar no Firebase Auth por email
        const userRecord = await auth.getUserByEmail(adminUser.email);
        console.log(`   ✅ Encontrado no Firebase Auth - UID: ${userRecord.uid}`);
        
        // Verificar custom claims
        if (userRecord.customClaims && userRecord.customClaims.admin === true) {
          console.log('   ✅ Tem custom claim admin: true');
        } else {
          console.log('   ⚠️ NÃO tem custom claim admin');
          
          // Definir custom claim
          console.log('   🔧 Definindo custom claim admin...');
          await auth.setCustomUserClaims(userRecord.uid, { admin: true });
          console.log('   ✅ Custom claim admin definido');
        }
        
        // Verificar se authorizedUser tem Firebase UID
        if (adminUser.firebaseUid) {
          if (adminUser.firebaseUid === userRecord.uid) {
            console.log('   ✅ Firebase UID corresponde');
          } else {
            console.log(`   ⚠️ Firebase UID não corresponde: ${adminUser.firebaseUid} vs ${userRecord.uid}`);
          }
        } else {
          console.log('   ⚠️ authorizedUser não tem firebaseUid');
          
          // Atualizar com Firebase UID
          await db.collection('authorizedUsers').doc(adminUser.id).update({
            firebaseUid: userRecord.uid
          });
          console.log('   ✅ Firebase UID atualizado no authorizedUser');
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao verificar ${adminUser.email}:`, error.message);
      }
    }

    // 4. Testar exclusão com contexto de usuário específico
    console.log('\n🗑️ 4. Testando exclusão com contexto de usuário:');
    
    // Criar documento de teste
    const testData = {
      title: 'TESTE AUTH - Exclusão',
      content: 'Teste de exclusão com autenticação',
      status: 'rascunho',
      authorId: adminUsers[0]?.id || 'test-author',
      authorFirebaseUid: adminUsers[0]?.firebaseUid || 'test-uid',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      history: []
    };

    const testDocRef = await db.collection('roteiros').add(testData);
    console.log(`   📝 Documento de teste criado: ${testDocRef.id}`);

    // Simular verificação de permissões como no frontend
    for (const adminUser of adminUsers.slice(0, 2)) { // Testar apenas os 2 primeiros
      console.log(`\n   🔐 Testando permissões para: ${adminUser.name}`);
      
      try {
        // Verificar se o usuário tem permissão (simulando isUserAdmin)
        const hasAdminRole = adminUser.role === 'admin';
        const isAdminEmail = ['fontedevidalaranjeiras@gmail.com', 'secretaria.adfdevidalaranjeiras@gmail.com'].includes(adminUser.email);
        
        console.log(`   - Role admin: ${hasAdminRole}`);
        console.log(`   - Email admin: ${isAdminEmail}`);
        
        if (hasAdminRole || isAdminEmail) {
          console.log('   ✅ Deveria ter permissão para excluir');
          
          // Tentar excluir (usando Admin SDK, sempre funcionará)
          const docRef = db.collection('roteiros').doc(testDocRef.id);
          const docExists = await docRef.get();
          
          if (docExists.exists) {
            await docRef.delete();
            console.log('   ✅ Exclusão bem-sucedida');
            
            // Recriar para próximo teste
            const newTestRef = await db.collection('roteiros').add(testData);
            testDocRef.id = newTestRef.id;
          } else {
            console.log('   ⚠️ Documento já foi excluído');
          }
        } else {
          console.log('   ❌ NÃO deveria ter permissão para excluir');
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao testar permissões:`, error.message);
      }
    }

    // 5. Verificar regras de segurança simulando diferentes contextos
    console.log('\n🛡️ 5. Simulando verificação de regras de segurança:');
    
    const testContexts = [
      {
        name: 'Admin principal',
        uid: 'NVwtRvafRsXTU7DHdmKlvpJQJGr1',
        email: 'secretaria.adfdevidalaranjeiras@gmail.com',
        claims: { admin: true }
      },
      {
        name: 'Admin secundário', 
        uid: '3lhdKt9Jxtb5hbu3fDRusi0Hs6X2',
        email: 'fontedevidalaranjeiras@gmail.com',
        claims: { admin: true }
      },
      {
        name: 'Usuário comum',
        uid: '3atWn0a9q1WYuKaKReU0xuBdMJ43',
        email: 'machado.warllei@gmail.com',
        claims: {}
      }
    ];

    for (const context of testContexts) {
      console.log(`\n   🧪 Contexto: ${context.name}`);
      console.log(`   - UID: ${context.uid}`);
      console.log(`   - Email: ${context.email}`);
      console.log(`   - Claims: ${JSON.stringify(context.claims)}`);
      
      // Simular verificação das regras
      const hasAdminClaim = context.claims.admin === true;
      const isAdminEmail = ['fontedevidalaranjeiras@gmail.com', 'secretaria.adfdevidalaranjeiras@gmail.com'].includes(context.email);
      
      const shouldAllowDelete = hasAdminClaim || isAdminEmail;
      console.log(`   - Deveria permitir exclusão: ${shouldAllowDelete}`);
      
      if (shouldAllowDelete) {
        console.log('   ✅ Regras permitiriam exclusão');
      } else {
        console.log('   ❌ Regras bloqueariam exclusão');
      }
    }

    // Limpar documento de teste
    try {
      await db.collection('roteiros').doc(testDocRef.id).delete();
      console.log('\n🧹 Documento de teste limpo');
    } catch (error) {
      console.log('\n⚠️ Documento de teste já foi limpo');
    }

    // 6. Verificar estado atual das custom claims
    console.log('\n🏷️ 6. Estado atual das custom claims:');
    
    for (const adminUser of adminUsers) {
      try {
        const userRecord = await auth.getUserByEmail(adminUser.email);
        console.log(`   👤 ${adminUser.name}:`);
        console.log(`      - UID: ${userRecord.uid}`);
        console.log(`      - Claims: ${JSON.stringify(userRecord.customClaims || {})}`);
        
        // Verificar token atual
        const customToken = await auth.createCustomToken(userRecord.uid, { admin: true });
        console.log(`      - Token personalizado criado: ${customToken.substring(0, 50)}...`);
        
      } catch (error) {
        console.log(`   ❌ Erro ao verificar ${adminUser.email}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante teste de autenticação:', error);
  }
}

// Executar teste
testFrontendAuthReal()
  .then(() => {
    console.log('\n✅ Teste de autenticação concluído');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal no teste:', error);
    process.exit(1);
  });