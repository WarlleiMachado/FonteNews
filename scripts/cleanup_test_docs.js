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
    const snap = await db.collection('announcements').get();
    const removed = [];
    for (const doc of snap.docs) {
      if (doc.id.startsWith('test-') || doc.id.startsWith('client-sdk-') || doc.id.startsWith('test-correct-') || doc.id.startsWith('test-wrong-') || doc.id.startsWith('test-missing-')) {
        await db.collection('announcements').doc(doc.id).delete();
        removed.push(doc.id);
        console.log('Deleted', doc.id);
      }
    }
    const outPath = path.join(process.cwd(), 'reports', 'cleanup_test_docs_result.json');
    fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), removed }, null, 2));
    console.log('Report written to', outPath);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning up test docs:', err);
    process.exit(1);
  }
})();
