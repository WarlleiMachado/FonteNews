#!/usr/bin/env node
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
const db = admin.firestore();

(async function main(){
  try {
    const qSnap = await db.collection('announcements').orderBy('createdAt', 'desc').limit(20).get();
    console.log('Recent announcements:');
    qSnap.docs.forEach(d => {
      const data = d.data();
      console.log('---', d.id);
      console.log('title:', data.title);
      console.log('authorId:', data.authorId);
      console.log('authorFirebaseUid:', data.authorFirebaseUid);
      console.log('createdAt:', data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error listing announcements:', err);
    process.exit(1);
  }
})();
