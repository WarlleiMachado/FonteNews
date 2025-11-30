import { doc, setDoc, increment, serverTimestamp, getDoc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type RoleKey = 'admin' | 'editor' | 'leader' | 'reader' | 'anonymous';

const getTodayId = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const resolveRole = async (): Promise<RoleKey> => {
  const fbUser = auth.currentUser;
  if (!fbUser) return 'anonymous';

  try {
    // Tentar ler papel em /users/{uid}
    const snap = await getDoc(doc(db, 'users', fbUser.uid));
    const role = (snap.exists() ? (snap.data() as any)?.role : undefined) as RoleKey | undefined;
    if (role === 'admin' || role === 'editor' || role === 'leader' || role === 'reader') {
      return role;
    }
  } catch {}

  // Fallback: mapear por claims básicas
  try {
    const token = await fbUser.getIdTokenResult();
    if (token.claims.admin === true) return 'admin';
  } catch {}

  // Fallback genérico
  return 'reader';
};

const getOrCreateVisitorId = (): string => {
  try {
    const key = 'fonteVisitorId';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const generated = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, generated);
    return generated;
  } catch {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

const getVisitorKey = (): string => {
  const fbUser = auth.currentUser;
  if (fbUser?.uid) return `auth:${fbUser.uid}`;
  return `anon:${getOrCreateVisitorId()}`;
};

export const trackDailyVisit = async (): Promise<void> => {
  const todayId = getTodayId();
  const role = await resolveRole();
  const visitorKey = getVisitorKey();

  const detailsRef = doc(db, 'visitorDaily', todayId, 'details', visitorKey);
  const aggregateRef = doc(db, 'visitorDaily', todayId);

  try {
    await runTransaction(db, async (tx) => {
      const existing = await tx.get(detailsRef);
      if (existing.exists()) {
        // Já contamos esta pessoa hoje; não incrementar novamente
        return;
      }

      // Registrar detalhe único do dia por visitante
      tx.set(detailsRef, {
        dateId: todayId,
        visitorKey,
        role,
        firstSeenAt: serverTimestamp(),
      });

      // Incrementar agregados apenas na primeira vez do dia
      tx.set(
        aggregateRef,
        {
          dateId: todayId,
          updatedAt: serverTimestamp(),
          total: increment(1),
          roles: {
            admin: role === 'admin' ? increment(1) : increment(0),
            editor: role === 'editor' ? increment(1) : increment(0),
            leader: role === 'leader' ? increment(1) : increment(0),
            reader: role === 'reader' ? increment(1) : increment(0),
            anonymous: role === 'anonymous' ? increment(1) : increment(0),
          },
        },
        { merge: true }
      );
    });
  } catch (err) {
    console.warn('⚠️ Falha ao rastrear visita diária com transação:', err);
  }
};