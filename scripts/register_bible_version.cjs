#!/usr/bin/env node
// Registra ou atualiza metadados de uma versão bíblica em Firestore.
// Uso:
// node scripts/register_bible_version.cjs --name "Nova Versão Internacional" --abbr "NVI" --lang "pt-BR" --path "bible/versions/nvi.json" --default true --active true

const admin = require('firebase-admin');
const path = require('path');

function getArg(name, def = undefined) {
  const idx = process.argv.findIndex((a) => a === `--${name}`);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return def;
}

const NAME = getArg('name');
const ABBR = (getArg('abbr') || '').toUpperCase();
const LANG = getArg('lang', null);
const STORAGE_PATH = getArg('path');
const DEFAULT = String(getArg('default', 'true')).toLowerCase() === 'true';
const ACTIVE = String(getArg('active', 'true')).toLowerCase() === 'true';

if (!NAME || !ABBR || !STORAGE_PATH) {
  console.error('Parâmetros obrigatórios: --name, --abbr, --path');
  process.exit(1);
}

const serviceAccount = require(path.resolve(__dirname, '../fontenews-877a3-485d38363783.json'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const versionsCol = db.collection('bibleVersions');
  const now = admin.firestore.FieldValue.serverTimestamp();

  // Procura por abreviação
  const snap = await versionsCol.where('abbr', '==', ABBR).limit(1).get();
  let docRef;
  const payload = {
    name: NAME.trim(),
    abbr: ABBR,
    language: LANG || null,
    active: ACTIVE,
    default: DEFAULT,
    storagePath: STORAGE_PATH,
    updatedAt: now,
  };

  if (snap.empty) {
    docRef = versionsCol.doc();
    await docRef.set({ ...payload, createdAt: now });
    console.log('Versão criada:', docRef.id, payload);
  } else {
    docRef = snap.docs[0].ref;
    await docRef.update(payload);
    console.log('Versão atualizada:', docRef.id, payload);
  }

  // Ajusta default: deixa apenas esta como padrão
  if (DEFAULT) {
    const all = await versionsCol.get();
    const batch = db.batch();
    all.forEach((d) => {
      const isTarget = d.id === docRef.id;
      batch.update(d.ref, { default: isTarget });
    });
    await batch.commit();
    console.log('Marcada como versão padrão:', docRef.id);
  }

  console.log('Concluído.');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});