import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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
    console.log('Attempting to add a test authorizedUsers document (may be blocked by rules)');
    const ref = await addDoc(collection(db, 'authorizedUsers'), {
      name: 'Temp Test User',
      email: 'test-user-deploy@fonte-news.local',
      role: 'editor',
      phone: '(00) 00000-0000',
      password: 'temporary',
      avatarUrl: '',
      status: 'active',
      createdAt: new Date(),
      isProtected: false
    });
    console.log('Created doc id:', ref.id);
  }catch(err){
    console.error('Failed to create authorized user doc:', err);
  }
})();
