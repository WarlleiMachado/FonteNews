// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { isFirebaseEnabled } from './env';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Configuração Firebase com suporte a variáveis de ambiente (Vite) e fallback
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyAWQz-_BDuMtGdGwS9KpAUZvC4_0kpjoAM",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "fontenews-877a3.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "fontenews-877a3",
  // storageBucket padrão: <projectId>.appspot.com
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "fontenews-877a3.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "920658565832",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:920658565832:web:33f3aea58c6a9377f4e3fd",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-6C8W88C3XN"
};



let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;

if (isFirebaseEnabled()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  analytics = getAnalytics(app);
  setPersistence(auth, browserSessionPersistence).catch((error) => {
    console.error("Error setting auth persistence:", error);
  });
} else {
  app = null;
}

export { app, auth, db, storage, analytics };
export default app;
