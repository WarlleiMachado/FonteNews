import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM",
  authDomain: "fontenews-877a3.firebaseapp.com",
  projectId: "fontenews-877a3",
  storageBucket: "fontenews-877a3.firebasestorage.app",
  messagingSenderId: "920658565832",
  appId: "1:920658565832:web:33f3aea58c6a9377f4e3fd",
  measurementId: "G-6C8W88C3XN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const apiKey = firebaseConfig.apiKey;
const reportsDir = './reports';

(async () => {
  try{
    if(!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    console.log('Reading authorizedUsers...');
    const snapshot = await getDocs(collection(db, 'authorizedUsers'));
    const results = [];
    for(const doc of snapshot.docs){
      const data = doc.data();
      const email = data.email;
      const record = { id: doc.id, email, hasFirebaseUid: !!data.firebaseUid, firebaseUid: data.firebaseUid || null, matchedAuth: false, authLocalId: null };
      if(email){
        try{
          const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: [email] })
          });
          const json = await resp.json();
          if(json && json.users && json.users.length>0){
            record.matchedAuth = true;
            record.authLocalId = json.users[0].localId;
          }
        }catch(err){
          console.error('Error lookup for', email, err);
        }
      }
      results.push(record);
    }
    const outPath = `${reportsDir}/authorized_users_mapping.json`;
    fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
    console.log('Report written to', outPath);
    console.log('Summary: total:', results.length, 'matchedAuth:', results.filter(r=>r.matchedAuth).length);
  }catch(err){
    console.error('Unexpected error:', err);
  }
})();
