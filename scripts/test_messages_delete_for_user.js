#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

// Initialize Admin SDK to mint a custom token for an existing user
const serviceAccountPath = path.resolve('./fontenews-877a3-485d38363783.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account missing:', serviceAccountPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// Minimal Firebase client config (matches project)
const firebaseConfig = {
  apiKey: 'AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM',
  authDomain: 'fontenews-877a3.firebaseapp.com',
  projectId: 'fontenews-877a3'
};

async function main() {
  // Use a known UID (admin/secretaria) to simulate frontend client
  const TEST_UID = 'NVwtRvafRsXTU7DHdmKlvpJQJGr1';
  console.log('🔐 Minting custom token for UID:', TEST_UID);
  const customToken = await admin.auth().createCustomToken(TEST_UID);

  // Initialize client app and sign in
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('🔐 Signing in client SDK with custom token...');
  const userCred = await signInWithCustomToken(auth, customToken);
  console.log('✅ Signed in as:', userCred.user.uid);

  // Read /users/{uid} to get authorizedUserId for rules mapping
  const userDocRef = doc(db, 'users', userCred.user.uid);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    console.error('❌ users/{uid} document not found. Mapping is required for rules.');
    process.exit(2);
  }
  const { authorizedUserId } = userDocSnap.data() || {};
  if (!authorizedUserId) {
    console.error('❌ authorizedUserId missing in users/{uid}.');
    process.exit(3);
  }
  console.log('👤 authorizedUserId:', authorizedUserId);

  // Try to find a message where this user is a recipient
  console.log('🔎 Querying messages where user is recipient...');
  const messagesRef = collection(db, 'messages');
  let foundMessage = null;
  try {
    const q1 = query(
      messagesRef,
      where('recipientIds', 'array-contains', authorizedUserId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      foundMessage = snap1.docs[0];
    }
  } catch (err) {
    console.error('⚠️ Error querying recipientIds:', err.message || err);
  }

  // If not found, fallback to messages where user is the sender
  if (!foundMessage) {
    console.log('🔎 Fallback: querying messages where user is sender...');
    try {
      const q2 = query(
        messagesRef,
        where('senderId', '==', authorizedUserId),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        foundMessage = snap2.docs[0];
      }
    } catch (err) {
      console.error('⚠️ Error querying senderId:', err.message || err);
    }
  }

  if (!foundMessage) {
    console.log('❌ No message found for this user (recipient or sender).');
    process.exit(0);
  }

  console.log('📄 Found message:', foundMessage.id);
  const msgData = foundMessage.data();
  console.log('   SenderId:', msgData.senderId);
  console.log('   RecipientIds:', Array.isArray(msgData.recipientIds) ? msgData.recipientIds.join(', ') : msgData.recipientIds);

  // Attempt to update deletedForUserIds for this authorized user
  const currentDeleted = Array.isArray(msgData.deletedForUserIds) ? msgData.deletedForUserIds : [];
  const willSetDeleted = Array.from(new Set([ ...currentDeleted, authorizedUserId ]));

  console.log('📝 Attempting update: add authorizedUserId to deletedForUserIds...');
  try {
    await updateDoc(doc(db, 'messages', foundMessage.id), { deletedForUserIds: willSetDeleted });
    console.log('✅ Update succeeded. Connectivity and permissions look OK.');

    // Optional revert to avoid persistent change
    if (!currentDeleted.includes(authorizedUserId)) {
      console.log('↩️ Reverting update to restore previous state...');
      await updateDoc(doc(db, 'messages', foundMessage.id), { deletedForUserIds: currentDeleted });
      console.log('✅ Revert succeeded.');
    }
  } catch (error) {
    console.error('❌ Update failed:', error);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    process.exit(4);
  }
}

main().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});