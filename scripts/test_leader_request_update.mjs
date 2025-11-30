import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';

// Firebase config (production)
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

(async () => {
  try {
    console.log('Creating test leader request...');
    const createPayload = {
      name: 'Teste Solicitação',
      email: 'teste.solicitacao@fonte-news.local',
      phone: '(00) 00000-0000',
      ministry: 'Teste',
      status: 'pending',
      createdAt: Timestamp.fromDate(new Date())
    };
    const createdRef = await addDoc(collection(db, 'leaderRequests'), createPayload);
    console.log('Created leaderRequests doc id:', createdRef.id);

    console.log('Updating status to approved...');
    const targetRef = doc(db, 'leaderRequests', createdRef.id);
    await updateDoc(targetRef, { status: 'approved' });
    console.log('Update succeeded. ✅');
  } catch (err) {
    console.error('Update failed. ❌');
    console.error('Error object:', err);
    console.error('Error code:', err?.code);
    console.error('Error message:', err?.message);
  }
})();