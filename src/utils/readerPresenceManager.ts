import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Semelhante ao anonPresenceManager, mas para leitores autenticados (firebaseUser sem AuthorizedUser)
// Mantém um heartbeat por aba para saber quem está online em tempo real

type ReaderPresenceState = {
  tabId: string | null;
  uid: string | null;
  heartbeatIntervalId: any;
};

const state: ReaderPresenceState = {
  tabId: null,
  uid: null,
  heartbeatIntervalId: null
};

const COLLECTION = 'readerOnlineUsers';
const HEARTBEAT_MS = 20_000; // 20s

function getDocId(uid: string, tabId: string) {
  return `${uid}_${tabId}`;
}

async function writePresence(uid: string, tabId: string) {
  const docId = getDocId(uid, tabId);
  const ref = doc(db, COLLECTION, docId);
  await setDoc(ref, {
    uid,
    tabId,
    lastSeen: serverTimestamp(),
    isActive: true
  }, { merge: true });
}

async function clearPresence(uid: string, tabId: string) {
  const docId = getDocId(uid, tabId);
  const ref = doc(db, COLLECTION, docId);
  try {
    await deleteDoc(ref);
  } catch (e) {
    // Ignora erros de limpeza
    console.warn('readerPresenceManager: erro ao limpar presença', e);
  }
}

export const readerPresenceManager = {
  async setOnline() {
    const current = auth.currentUser;
    if (!current) {
      await this.setOffline();
      return;
    }
    const uid = current.uid;
    if (!state.tabId) state.tabId = uuidv4();
    state.uid = uid;

    await writePresence(uid, state.tabId);

    if (state.heartbeatIntervalId) clearInterval(state.heartbeatIntervalId);
    state.heartbeatIntervalId = setInterval(() => {
      if (state.uid && state.tabId) {
        writePresence(state.uid, state.tabId);
      }
    }, HEARTBEAT_MS);

    window.addEventListener('beforeunload', this._handleBeforeUnload);
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
  },

  async setOffline() {
    if (state.heartbeatIntervalId) {
      clearInterval(state.heartbeatIntervalId);
      state.heartbeatIntervalId = null;
    }
    window.removeEventListener('beforeunload', this._handleBeforeUnload);
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);

    if (state.uid && state.tabId) {
      await clearPresence(state.uid, state.tabId);
    }
  },

  _handleBeforeUnload: async () => {
    if (state.uid && state.tabId) {
      await clearPresence(state.uid, state.tabId);
    }
  },

  _handleVisibilityChange: async () => {
    if (document.visibilityState === 'hidden') {
      // Opcional: poderíamos reduzir heartbeat quando hidden
      return;
    }
    if (state.uid && state.tabId) {
      await writePresence(state.uid, state.tabId);
    }
  }
};

export default readerPresenceManager;