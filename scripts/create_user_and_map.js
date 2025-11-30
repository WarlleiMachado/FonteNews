#!/usr/bin/env node
/*
Create a Firebase Auth user and map to authorizedUsers document.
Usage:
  node create_user_and_map.js --serviceAccount ./service-account.json --email user@example.com [--displayName "Name"] [--password "P@ssw0rd"]

If password not provided, a random temporary password will be generated and printed.
The script will:
 - create a user in Firebase Auth (if not existing)
 - find an authorizedUsers doc by email and set firebaseUid, or create one if missing
 - output the new user's uid and temporary password
*/

import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import crypto from 'crypto';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('serviceAccount', { type: 'string', demandOption: true })
  .option('email', { type: 'string', demandOption: true })
  .option('displayName', { type: 'string', demandOption: false })
  .option('password', { type: 'string', demandOption: false })
  .argv;

const saPath = path.resolve(argv.serviceAccount);
if(!fs.existsSync(saPath)){
  console.error('Service account file not found at', saPath); process.exit(1);
}
const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

function genPassword(){
  return crypto.randomBytes(8).toString('base64').replace(/[^A-Za-z0-9]/g, 'A1');
}

(async ()=>{
  try{
    const email = argv.email;
    const displayName = argv.displayName || '';
    let password = argv.password || genPassword();

    // Check if user already exists
    let userRecord = null;
    try{
      userRecord = await admin.auth().getUserByEmail(email).catch(()=>null);
    }catch(e){ userRecord = null }

    if(userRecord){
      console.log('User already exists:', userRecord.uid);
    }else{
      const createReq = { email, emailVerified: false, password, displayName: displayName || undefined, disabled: false };
      userRecord = await admin.auth().createUser(createReq);
      console.log('Created user:', userRecord.uid);
    }

    // find authorizedUsers doc by email
    const q = await db.collection('authorizedUsers').where('email', '==', email).limit(1).get();
    if(!q.empty){
      const doc = q.docs[0];
      await db.collection('authorizedUsers').doc(doc.id).update({ firebaseUid: userRecord.uid });
      console.log('Updated authorizedUsers doc', doc.id, 'with firebaseUid');
    }else{
      // create a new authorizedUsers doc minimal
      const newDoc = { email, name: displayName || '', firebaseUid: userRecord.uid };
      const ref = await db.collection('authorizedUsers').add(newDoc);
      console.log('Created authorizedUsers doc', ref.id);
    }

    // write short report
    const report = { generatedAt: new Date().toISOString(), email, uid: userRecord.uid, password: password };
    const outPath = path.join(process.cwd(),'reports','create_user_result.json');
    if(!fs.existsSync(path.join(process.cwd(),'reports'))) fs.mkdirSync(path.join(process.cwd(),'reports'));
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log('Report written to', outPath);
    console.log('Temporary password:', password);
    console.log('User can now sign in with this email and password; recommend forcing password reset or sending a reset link.');
    process.exit(0);
  }catch(err){
    console.error('Error:', err);
    process.exit(1);
  }
})();
