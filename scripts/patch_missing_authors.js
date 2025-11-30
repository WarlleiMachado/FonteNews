#!/usr/bin/env node
/**
 * Script: patch_missing_authors.js
 * Usage:
 *   node patch_missing_authors.js --serviceAccount=./serviceAccount.json
 *
 * This script applies safe patches for known documents missing authorId/authorFirebaseUid.
 * It is idempotent and will only set fields when missing.
 */

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('serviceAccount', { type: 'string', demandOption: true })
  .argv;

const serviceAccountPath = path.resolve(argv.serviceAccount);
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found at', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Safe default mapping: choose an existing authorizedUsers id that already has firebaseUid
// This was observed in reports: use id '8COwk6X80udVGdGuqS2Q' -> firebaseUid 'NVwtRvafRsXTU7DHdmKlvpJQJGr1'
const DEFAULT_APP_USER_ID = '8COwk6X80udVGdGuqS2Q';
const DEFAULT_FIREBASE_UID = 'NVwtRvafRsXTU7DHdmKlvpJQJGr1';

const PATCHES = [
  { collection: 'cultos', docId: 'D6Q8DKwuvDbHWvhZKiOs' },
  { collection: 'scripts', docId: 'RAIW3gcP5fivmNr85n8T' }
];

(async function main(){
  const results = [];
  for (const p of PATCHES) {
    try {
      const ref = db.collection(p.collection).doc(p.docId);
      const snap = await ref.get();
      if (!snap.exists) {
        results.push({ ...p, status: 'not-found' });
        console.log('Not found', p.collection, p.docId);
        continue;
      }
      const data = snap.data() || {};
      const updates = {};
      if (!data.authorId) updates.authorId = DEFAULT_APP_USER_ID;
      if (!data.authorFirebaseUid) updates.authorFirebaseUid = DEFAULT_FIREBASE_UID;
      if (Object.keys(updates).length === 0) {
        results.push({ ...p, status: 'noop' });
        console.log('No changes needed for', p.collection, p.docId);
        continue;
      }
      await ref.update(updates);
      results.push({ ...p, status: 'patched', updates });
      console.log('Patched', p.collection, p.docId, updates);
    } catch (err) {
      results.push({ ...p, status: 'error', error: String(err) });
      console.error('Error patching', p.collection, p.docId, err);
    }
  }

  const outPath = path.join(process.cwd(), 'reports', 'patch_missing_authors_result.json');
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  console.log('Report written to', outPath);
  process.exit(0);
})();
