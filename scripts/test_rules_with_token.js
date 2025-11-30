#!/usr/bin/env node
// Test script: exchange custom token for ID token and test Firestore rules via REST
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

const SERVICE_ACCOUNT = path.resolve('./fontenews-877a3-485d38363783.json');
if (!fs.existsSync(SERVICE_ACCOUNT)) {
  console.error('Service account not found at', SERVICE_ACCOUNT);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Use one of the known firebase UIDs from authorizedUsers mapping (safe admin user)
const TEST_FIREBASE_UID = 'NVwtRvafRsXTU7DHdmKlvpJQJGr1';
const WRONG_FIREBASE_UID = 'WRONG-UID-1234567890';
const PROJECT_ID = 'fontenews-877a3';
const API_KEY = 'AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM'; // from src/lib/firebase.ts

async function exchangeCustomTokenForIdToken(customToken) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`[token-exchange] ${res.status} ${JSON.stringify(data)}`);
  return data.idToken;
}

async function tryCreateAnnouncement(idToken, docId, payload) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/announcements?documentId=${docId}`;
  const body = { fields: {} };
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v === 'string') body.fields[k] = { stringValue: v };
    else if (v instanceof Date) body.fields[k] = { timestampValue: v.toISOString() };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
    body: JSON.stringify(body)
  });
  const data = await res.text();
  return { status: res.status, body: data };
}

(async function main(){
  try {
    console.log('Creating custom token for UID', TEST_FIREBASE_UID);
    const customToken = await admin.auth().createCustomToken(TEST_FIREBASE_UID);

    console.log('Exchanging custom token for ID token...');
    const idToken = await exchangeCustomTokenForIdToken(customToken);
    console.log('Got idToken (first 20 chars):', idToken.slice(0,20));

    // Case 1: correct authorFirebaseUid
    const doc1 = 'test-correct-' + Date.now();
    const payload1 = { title: 'Test allowed', content: 'Allowed create', createdAt: new Date(), authorFirebaseUid: TEST_FIREBASE_UID };
    const r1 = await tryCreateAnnouncement(idToken, doc1, payload1);
    console.log('Case1 (correct uid) ->', r1.status, r1.body.substring(0,400));

    // Case 2: wrong authorFirebaseUid
    const doc2 = 'test-wrong-' + Date.now();
    const payload2 = { title: 'Test denied', content: 'Denied create', createdAt: new Date(), authorFirebaseUid: WRONG_FIREBASE_UID };
    const r2 = await tryCreateAnnouncement(idToken, doc2, payload2);
    console.log('Case2 (wrong uid) ->', r2.status, r2.body.substring(0,400));

    // Case 3: missing authorFirebaseUid
    const doc3 = 'test-missing-' + Date.now();
    const payload3 = { title: 'Test missing', content: 'Missing uid', createdAt: new Date() };
    const r3 = await tryCreateAnnouncement(idToken, doc3, payload3);
    console.log('Case3 (missing uid) ->', r3.status, r3.body.substring(0,400));

    console.log('Test complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
})();
