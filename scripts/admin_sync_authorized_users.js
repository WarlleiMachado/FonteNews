#!/usr/bin/env node
/*
Script: admin_sync_authorized_users.js
Usage:
  node admin_sync_authorized_users.js --serviceAccount=./serviceAccountKey.json [--dryRun]

What it does:
  - Uses Firebase Admin SDK with provided service account JSON to access Auth and Firestore.
  - Reads all documents in `authorizedUsers` collection.
  - For each doc with an `email` and missing `firebaseUid`, it looks up the user in Firebase Auth by email.
  - If found, updates the doc setting `firebaseUid` to the Auth user's UID.
  - Produces a report at ./reports/authorized_users_sync_result.json

Safety:
  - Default is to modify documents. Use --dryRun to only preview changes.
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

(async function main(){
  const reportsDir = path.join(process.cwd(), 'reports');
  if(!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  const result = { generatedAt: new Date().toISOString(), changes: [] };

  console.log('Reading authorizedUsers collection...');
  const snapshot = await db.collection('authorizedUsers').get();
  console.log('Found', snapshot.size, 'documents');

  for(const doc of snapshot.docs){
    const data = doc.data();
    const email = data.email;
    const currentFirebaseUid = data.firebaseUid || null;
    const entry = { id: doc.id, email, currentFirebaseUid, willSetFirebaseUid: null, action: null, error: null };
    if(!email){
      entry.action = 'skip-no-email';
      result.changes.push(entry);
      console.log('Skipping', doc.id, '- no email');
      continue;
    }
    if(currentFirebaseUid){
      entry.action = 'skip-already-has-uid';
      result.changes.push(entry);
      console.log('Skipping', doc.id, '- already has firebaseUid');
      continue;
    }

    try{
      const userRecord = await admin.auth().getUserByEmail(email).catch(err=>{ return null; });
      if(userRecord && userRecord.uid){
        entry.willSetFirebaseUid = userRecord.uid;
        entry.action = argv.dryRun ? 'would-set' : 'set';
        result.changes.push(entry);
        console.log((argv.dryRun ? '[DRY] Would set' : 'Setting'), 'firebaseUid for', doc.id, '->', userRecord.uid);
        if(!argv.dryRun){
          await db.collection('authorizedUsers').doc(doc.id).update({ firebaseUid: userRecord.uid });
        }
      }else{
        entry.action = 'no-auth-user-found';
        result.changes.push(entry);
        console.log('No Auth user found for email', email);
      }
    }catch(err){
      entry.error = String(err);
      entry.action = 'error';
      result.changes.push(entry);
      console.error('Error processing', doc.id, err);
    }
  }

  const outPath = path.join(reportsDir, 'authorized_users_sync_result.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log('Report written to', outPath);
  console.log('Done.');
  process.exit(0);
})();
