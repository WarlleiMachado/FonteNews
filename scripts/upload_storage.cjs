#!/usr/bin/env node
// Upload a local file to Firebase Storage using Admin SDK
// Usage:
//   node scripts/upload_storage.cjs --local ./bible/bible-data/nvi2.json --dest bible/versions/nvi2.json

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

function getArg(name, def = undefined) {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return def;
}

const LOCAL = getArg('local');
const DEST = getArg('dest');
const SERVICE = getArg('service', path.resolve(__dirname, '../fontenews-877a3-485d38363783.json'));
const BUCKET = getArg('bucket', 'fontenews-877a3.appspot.com');

if (!LOCAL || !DEST) {
  console.error('Parâmetros obrigatórios: --local, --dest');
  process.exit(1);
}

if (!fs.existsSync(LOCAL)) {
  console.error('Arquivo local não encontrado:', LOCAL);
  process.exit(1);
}

const serviceAccount = require(SERVICE);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: BUCKET,
});

async function main(){
  const bucket = admin.storage().bucket(BUCKET);
  console.log('Uploading to bucket:', BUCKET, 'dest:', DEST);
  await bucket.upload(LOCAL, {
    destination: DEST,
    gzip: true,
    metadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=60',
    },
  });
  console.log('Upload concluído:', DEST);
}

main().then(()=>process.exit(0)).catch(err=>{
  console.error('Falha ao fazer upload:', err);
  process.exit(1);
});