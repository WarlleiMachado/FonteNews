// Migrar mensagens para incluir senderFirebaseUid e recipientFirebaseUids
// Usa firebase-admin com service account local
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.resolve(process.cwd(), 'fontenews-877a3-485d38363783.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account JSON não encontrado:', serviceAccountPath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')))
});

const db = admin.firestore();

async function getAuthorizedUserFirebaseUid(userId) {
  try {
    const snap = await db.collection('authorizedUsers').doc(userId).get();
    if (!snap.exists) return null;
    const data = snap.data() || {};
    return data.firebaseUid || null;
  } catch (e) {
    console.error('Erro ao buscar authorizedUser:', userId, e.message);
    return null;
  }
}

async function migrate() {
  console.log('🚀 Iniciando migração de mensagens para incluir Firebase UIDs...');
  const messagesSnap = await db.collection('messages').get();
  console.log(`📄 Total de mensagens encontradas: ${messagesSnap.size}`);

  let updatedCount = 0;
  for (const docSnap of messagesSnap.docs) {
    const data = docSnap.data() || {};
    const updates = {};

    // Preencher senderFirebaseUid se ausente
    if (!data.senderFirebaseUid && data.senderId) {
      const senderUid = await getAuthorizedUserFirebaseUid(data.senderId);
      if (senderUid) {
        updates.senderFirebaseUid = senderUid;
      }
    }

    // Preencher recipientFirebaseUids se ausente ou vazio
    const recUids = Array.isArray(data.recipientFirebaseUids) ? data.recipientFirebaseUids.filter(Boolean) : [];
    if (recUids.length === 0 && Array.isArray(data.recipientIds) && data.recipientIds.length > 0) {
      const resolved = [];
      for (const rid of data.recipientIds) {
        const uid = await getAuthorizedUserFirebaseUid(rid);
        if (uid) resolved.push(uid);
      }
      if (resolved.length > 0) {
        updates.recipientFirebaseUids = resolved;
      }
    }

    if (Object.keys(updates).length > 0) {
      try {
        await docSnap.ref.update(updates);
        updatedCount++;
        console.log(`✅ Atualizado mensagem ${docSnap.id}:`, updates);
      } catch (e) {
        console.error(`❌ Falha ao atualizar mensagem ${docSnap.id}:`, e.message);
      }
    }
  }

  console.log(`🏁 Migração concluída. Mensagens atualizadas: ${updatedCount}/${messagesSnap.size}`);
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error('❌ Erro na migração:', err);
  process.exit(1);
});