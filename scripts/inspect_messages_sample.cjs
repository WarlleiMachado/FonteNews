const admin = require('firebase-admin');

// Configuração Admin SDK
const serviceAccount = require('../fontenews-877a3-485d38363783.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'fontenews-877a3' });
const db = admin.firestore();

async function run(){
  console.log('🔎 Lendo amostras de mensagens...');
  const snap = await db.collection('messages').orderBy('createdAt', 'desc').limit(5).get();
  console.log('Total lido:', snap.size);
  snap.docs.forEach((d, i) => {
    const data = d.data() || {};
    console.log(`\n#${i+1} ID: ${d.id}`);
    console.log('senderId:', data.senderId);
    console.log('recipientIds:', Array.isArray(data.recipientIds) ? data.recipientIds : data.recipientIds);
    console.log('senderFirebaseUid:', data.senderFirebaseUid);
    console.log('recipientFirebaseUids:', Array.isArray(data.recipientFirebaseUids) ? data.recipientFirebaseUids : data.recipientFirebaseUids);
    console.log('deletedForUserIds:', Array.isArray(data.deletedForUserIds) ? data.deletedForUserIds : data.deletedForUserIds);
    console.log('createdAt:', data.createdAt);
    console.log('title:', data.title || data.subject || '');
  });
}

run().then(()=>{ console.log('\n🏁 Inspeção concluída'); process.exit(0); }).catch(err=>{ console.error('❌ Erro na inspeção:', err); process.exit(1); });