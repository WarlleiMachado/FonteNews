#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const serviceAccountPath = path.resolve('./fontenews-877a3-485d38363783.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account missing:', serviceAccountPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const firebaseConfig = {
  apiKey: 'AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM',
  authDomain: 'fontenews-877a3.firebaseapp.com',
  projectId: 'fontenews-877a3'
};

async function runTest() {
  // create custom token for test uid
  const TEST_UID = 'NVwtRvafRsXTU7DHdmKlvpJQJGr1';
  const customToken = await admin.auth().createCustomToken(TEST_UID);

  // initialize client app
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // sign in with custom token
  console.log('Signing in client SDK with custom token for', TEST_UID);
  const userCred = await signInWithCustomToken(auth, customToken);
  console.log('Signed in as', userCred.user.uid);

  // Case 1: correct authorFirebaseUid
  try {
    const docRef = await addDoc(collection(db, 'announcements'), {
      title: 'client-sdk-correct-' + Date.now(),
      content: 'client sdk allowed',
      createdAt: serverTimestamp(),
      authorFirebaseUid: TEST_UID
    });
    console.log('Client SDK Case1 created doc id:', docRef.id);
  } catch (err) {
    console.error('Client SDK Case1 error:', err.message || err);
  }

  // Case 2: wrong authorFirebaseUid
  try {
    const docRef = await addDoc(collection(db, 'announcements'), {
      title: 'client-sdk-wrong-' + Date.now(),
      content: 'client sdk should be denied',
      createdAt: serverTimestamp(),
      authorFirebaseUid: 'WRONG-UID-12345'
    });
    console.log('Client SDK Case2 created doc id (unexpected):', docRef.id);
  } catch (err) {
    console.error('Client SDK Case2 (expected failure):', err.message || err);
  }

  // Case 3: missing authorFirebaseUid
  try {
    const docRef = await addDoc(collection(db, 'announcements'), {
      title: 'client-sdk-missing-' + Date.now(),
      content: 'client sdk missing uid',
      createdAt: serverTimestamp()
    });
    console.log('Client SDK Case3 created doc id (unexpected):', docRef.id);
  } catch (err) {
    console.error('Client SDK Case3 (expected failure):', err.message || err);
  }

  process.exit(0);
}

runTest().catch(err => { console.error('Fatal test error', err); process.exit(1); });
