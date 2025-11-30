import { db } from '../src/lib/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

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
