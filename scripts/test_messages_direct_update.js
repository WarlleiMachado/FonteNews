#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Setup Admin
const serviceAccountPath = path.resolve('./fontenews-877a3-485d38363783.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account missing:', serviceAccountPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'fontenews-877a3' });
}
const adminDb = admin.firestore();

const firebaseConfig = { apiKey: 'AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM', authDomain: 'fontenews-877a3.firebaseapp.com', projectId: 'fontenews-877a3' };

async function main(){
  const TEST_UID = 'NVwtRvafRsXTU7DHdmKlvpJQJGr1';
  console.log('🔐 Minting token for UID:', TEST_UID);
  const token = await admin.auth().createCustomToken(TEST_UID);

  // Read authorizedUserId via Admin
  const userDoc = await adminDb.collection('users').doc(TEST_UID).get();
  if(!userDoc.exists){ console.error('❌ users doc missing for UID'); process.exit(2); }
  const { authorizedUserId } = userDoc.data();
  if(!authorizedUserId){ console.error('❌ authorizedUserId missing'); process.exit(3); }
  console.log('👤 authorizedUserId:', authorizedUserId);

  // Find a message authored by this user via Admin (no index requirements client-side)
  const msgSnap = await adminDb.collection('messages').where('senderId', '==', authorizedUserId).limit(1).get();
  if(msgSnap.empty){ console.error('❌ No message found authored by this user'); process.exit(0); }
  const targetMsg = msgSnap.docs[0];
  const msgId = targetMsg.id;
  const currentDeleted = Array.isArray(targetMsg.data().deletedForUserIds) ? targetMsg.data().deletedForUserIds : [];
  const nextDeleted = Array.from(new Set([...currentDeleted, authorizedUserId]));
  console.log('📄 Target message:', msgId);

  // Client sign-in
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  await signInWithCustomToken(auth, token);
  console.log('✅ Client signed in');

  // Attempt update via client
  console.log('📝 Updating deletedForUserIds via client...');
  await updateDoc(doc(db, 'messages', msgId), { deletedForUserIds: nextDeleted });
  console.log('✅ Update succeeded');

  // Revert
  if(!currentDeleted.includes(authorizedUserId)){
    console.log('↩️ Reverting to previous deletedForUserIds...');
    await updateDoc(doc(db, 'messages', msgId), { deletedForUserIds: currentDeleted });
    console.log('✅ Revert done');
  }
}

main().then(()=>{ console.log('🏁 Done'); process.exit(0); }).catch(err=>{ console.error('❌ Error:', err); process.exit(1); });