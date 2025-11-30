#!/usr/bin/env node
/**
 * Script: migrate_authorFirebaseUid.js
 * Usage:
 *   node migrate_authorFirebaseUid.js --serviceAccount=./serviceAccountKey.json [--dryRun]
 *
 * What it does:
 *  - Uses Firebase Admin SDK to read authorizedUsers and build a map of appUserId -> firebaseUid
 *  - Scans target collections (announcements, cultos, scripts, messages) for documents
 *    that are missing `authorFirebaseUid` or have it null/empty.
 *  - If the document has `authorId`, it looks up authorizedUsers[authorId].firebaseUid
 *    and sets `authorFirebaseUid` accordingly.
 *  - Writes a report to ./reports/migrate_authorFirebaseUid_result.json
 */

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('serviceAccount', { type: 'string', demandOption: true, describe: 'Path to service account JSON' })
  .option('dryRun', { type: 'boolean', default: false, describe: 'Do not write changes, just preview' })
  .argv;

const serviceAccountPath = path.resolve(argv.serviceAccount);
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found at', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const TARGET_COLLECTIONS = ['announcements', 'cultos', 'scripts', 'messages'];

(async function main(){
  const reportsDir = path.join(process.cwd(), 'reports');
  if(!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const result = { generatedAt: new Date().toISOString(), dryRun: !!argv.dryRun, actions: [] };

  console.log('Loading authorizedUsers mapping...');
  const usersSnap = await db.collection('authorizedUsers').get();
  const userMap = new Map(); // appUserId -> firebaseUid
  usersSnap.docs.forEach(d => {
    const data = d.data();
    if (data && data.firebaseUid) {
      userMap.set(d.id, data.firebaseUid);
    }
  });
  console.log('Loaded', userMap.size, 'authorizedUsers with firebaseUid');

  for (const col of TARGET_COLLECTIONS) {
    console.log('\nScanning collection', col);
    const snap = await db.collection(col).get();
    console.log('Found', snap.size, 'documents in', col);

    for (const doc of snap.docs) {
      const data = doc.data();
      const existing = data.authorFirebaseUid || null;
      if (existing) continue; // already set

      const authorId = data.authorId || null;
      const entry = { collection: col, docId: doc.id, authorId, willSet: null, action: null, error: null };

      if (!authorId) {
        entry.action = 'skip-no-authorId';
        result.actions.push(entry);
        console.log('  -', doc.id, 'no authorId — skipping');
        continue;
      }

      const mappedFirebaseUid = userMap.get(authorId) || null;
      if (!mappedFirebaseUid) {
        entry.action = 'no-mapping-found';
        result.actions.push(entry);
        console.log('  -', doc.id, 'authorId', authorId, '→ no mapping found');
        continue;
      }

      entry.willSet = mappedFirebaseUid;
      entry.action = argv.dryRun ? 'would-set' : 'set';
      result.actions.push(entry);

      console.log('  -', doc.id, 'authorId', authorId, '→ will set authorFirebaseUid =', mappedFirebaseUid);
      if (!argv.dryRun) {
        try {
          await db.collection(col).doc(doc.id).update({ authorFirebaseUid: mappedFirebaseUid });
        } catch (err) {
          entry.error = String(err);
          entry.action = 'error';
          console.error('    Error updating', doc.id, err);
        }
      }
    }
  }

  const outPath = path.join(reportsDir, 'migrate_authorFirebaseUid_result.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log('\nReport written to', outPath);
  console.log('Done.');
  process.exit(0);
})();
