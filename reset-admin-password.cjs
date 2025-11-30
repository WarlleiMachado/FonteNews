const admin = require('firebase-admin');

// Configuração do Firebase Admin
const serviceAccount = require('./fontenews-877a3-485d38363783.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'fontenews-877a3'
});

const auth = admin.auth();

async function resetAdminPassword() {
  try {
    console.log('🔧 Redefinindo senha do usuário admin...');
    
    const email = 'fontedevidalaranjeiras@gmail.com';
    const newPassword = 'FonteVida2024!';
    
    // Buscar o usuário
    const userRecord = await auth.getUserByEmail(email);
    console.log('👤 Usuário encontrado:', userRecord.email);
    console.log('🆔 UID:', userRecord.uid);
    
    // Atualizar a senha
    await auth.updateUser(userRecord.uid, {
      password: newPassword,
      emailVerified: true
    });
    
    console.log('✅ Senha atualizada com sucesso');
    console.log('🔑 Nova senha:', newPassword);
    
    // Verificar custom claims
    const updatedUser = await auth.getUser(userRecord.uid);
    console.log('🎫 Custom claims:', updatedUser.customClaims);
    
    if (!updatedUser.customClaims || !updatedUser.customClaims.admin) {
      console.log('🔧 Definindo custom claims de admin...');
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });
      console.log('✅ Custom claims definidas');
    }
    
    // Fazer o mesmo para o outro admin
    console.log('\n🔧 Redefinindo senha do segundo admin...');
    
    const email2 = 'secretaria.adfdevidalaranjeiras@gmail.com';
    const userRecord2 = await auth.getUserByEmail(email2);
    
    await auth.updateUser(userRecord2.uid, {
      password: newPassword,
      emailVerified: true
    });
    
    console.log('✅ Segunda senha atualizada com sucesso');
    
    // Verificar custom claims do segundo usuário
    const updatedUser2 = await auth.getUser(userRecord2.uid);
    if (!updatedUser2.customClaims || !updatedUser2.customClaims.admin) {
      console.log('🔧 Definindo custom claims do segundo admin...');
      await auth.setCustomUserClaims(userRecord2.uid, { admin: true });
      console.log('✅ Custom claims do segundo admin definidas');
    }
    
    console.log('\n📋 Resumo:');
    console.log(`Email 1: ${email}`);
    console.log(`Email 2: ${email2}`);
    console.log(`Senha para ambos: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erro ao redefinir senha:', error);
  }
}

resetAdminPassword().then(() => {
  console.log('\n🏁 Redefinição de senhas concluída');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});