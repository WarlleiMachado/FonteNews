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

const getTodayId = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

async function deleteSubcollectionDocs(colRef) {
  const snap = await colRef.get();
  let count = 0;
  let batch = db.batch();
  let ops = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    ops++;
    count++;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) {
    await batch.commit();
  }
  return count;
}

(async function main(){
  const todayId = getTodayId();
  const aggRef = db.collection('visitorDaily').doc(todayId);
  const detailsRef = aggRef.collection('details');
  const report = { dateId: todayId, deletedDetails: 0, deletedAggregate: false };
  try {
    report.deletedDetails = await deleteSubcollectionDocs(detailsRef);
    await aggRef.delete();
    report.deletedAggregate = true;
    const outDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `reset_visitor_daily_${todayId}.json`);
    fs.writeFileSync(outPath, JSON.stringify({ ...report, at: new Date().toISOString() }, null, 2));
    console.log('Reset concluído:', report);
    console.log('Report escrito em', outPath);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao resetar visitorDaily:', err);
    process.exit(1);
  }
})();