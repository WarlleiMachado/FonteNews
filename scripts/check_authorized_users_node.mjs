import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Copied production config from src/lib/firebase.ts
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

(async function(){
  try{
    console.log('Connecting to Firestore (client SDK) and reading authorizedUsers...');
    const q = collection(db, 'authorizedUsers');
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} authorizedUsers documents`);
    const withFirebaseUid = snapshot.docs.filter(d => !!d.data().firebaseUid).map(d => ({ id: d.id, firebaseUid: d.data().firebaseUid }));
    console.log(`Documents with firebaseUid: ${withFirebaseUid.length}`);
    if(withFirebaseUid.length>0){
      console.log('Sample:', withFirebaseUid.slice(0,5));
    }
  }catch(err){
    console.error('Error reading authorizedUsers:', err);
  }
})();
