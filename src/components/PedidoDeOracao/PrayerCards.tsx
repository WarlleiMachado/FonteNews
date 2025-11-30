import React, { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, limit, orderBy, query, startAfter, where, doc, updateDoc, arrayUnion, arrayRemove, increment, onSnapshot } from 'firebase/firestore';
import { PrayerRequest, PrayerSettings } from '../../types';
// Usar ícones do plugin
import { motifLabel } from '../../utils/motifs';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../hooks/useTheme';

const PAGE_SIZE_FALLBACK = 6;

type Mode = 'public' | 'mine';
const PrayerCards: React.FC<{ mode?: Mode }> = ({ mode = 'public' }) => {
  const { user, firebaseUser } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const currentUid = (user?.firebaseUid || user?.id || firebaseUser?.uid) || null;
  const [items, setItems] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<{ motif: string; search: string; dateFilterType: 'none' | 'day' | 'year'; dateFilterValue: string }>({ motif: 'todos', search: '', dateFilterType: 'none', dateFilterValue: '' });
  const lastDocRef = useRef<any>(null);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_FALLBACK);
  const [motifColors, setMotifColors] = useState<Record<string, string>>({});
  const [allowUnpray, setAllowUnpray] = useState<boolean>(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [hideArchivedOnWall, setHideArchivedOnWall] = useState<boolean>(true);

  // Removido suporte a engajamento anônimo: coração requer login

  useEffect(() => {
    const onFilters = (e: any) => setFilters({ motif: e.detail.motif, search: e.detail.search, dateFilterType: e.detail.dateFilterType || 'none', dateFilterValue: e.detail.dateFilterValue || '' });
    window.addEventListener('prayers:filters', onFilters as any);
    return () => window.removeEventListener('prayers:filters', onFilters as any);
  }, []);

  const buildQuery = async (reset = false) => {
    if (reset) lastDocRef.current = null;
    const baseCol = collection(db, 'prayers');
    const clauses: any[] = [];
    // Listagem pública respeita a configuração para ocultar pedidos respondidos
    if (mode === 'public') {
      const statusList = hideArchivedOnWall ? ['approved', 'active'] : ['approved', 'active', 'archived'];
      clauses.push(where('status', 'in', statusList));
    }
    if (mode === 'mine') {
      const uid = (user?.firebaseUid || user?.id || firebaseUser?.uid);
      // Se não houver UID, não deve retornar nenhum pedido (evita vazamento)
      if (!uid) {
        return { list: [], last: null };
      }
      clauses.push(where('ownerUserId', '==', uid));
    }
    if (filters.motif && filters.motif !== 'todos') clauses.push(where('motif', '==', filters.motif));

    // Filtro de data (dia/ano) por faixa de datas
    if (filters.dateFilterType !== 'none' && filters.dateFilterValue) {
      if (filters.dateFilterType === 'day') {
        const [yStr, mStr, dStr] = String(filters.dateFilterValue).split('-');
        const y = Number(yStr), m = Number(mStr), d = Number(dStr);
        if (y && m && d) {
          const start = new Date(y, m - 1, d);
          const end = new Date(y, m - 1, d + 1);
          clauses.push(where('createdAt', '>=', start));
          clauses.push(where('createdAt', '<', end));
        }
      } else if (filters.dateFilterType === 'year') {
        const y = Number(filters.dateFilterValue);
        if (y) {
          const start = new Date(y, 0, 1);
          const end = new Date(y + 1, 0, 1);
          clauses.push(where('createdAt', '>=', start));
          clauses.push(where('createdAt', '<', end));
        }
      }
    }

    let qRef = query(baseCol, ...clauses, orderBy('createdAt', 'desc'));
    if (!lastDocRef.current) {
      qRef = query(baseCol, ...clauses, orderBy('createdAt', 'desc'), limit(pageSize));
    } else {
      qRef = query(baseCol, ...clauses, orderBy('createdAt', 'desc'), startAfter(lastDocRef.current), limit(pageSize));
    }
    const snap = await getDocs(qRef);
    const list: PrayerRequest[] = [] as any;
    snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
    const last = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
    lastDocRef.current = last;
    return { list, last };
  };

  const load = async (reset = false) => {
    try {
      setLoading(true);
      const { list } = await buildQuery(reset);
      setItems(prev => reset ? list : [...prev, ...list]);
      setHasMore(list.length >= pageSize);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setItems([]); setHasMore(true); load(true); }, [filters.motif, filters.search, filters.dateFilterType, filters.dateFilterValue, hideArchivedOnWall]);

  useEffect(() => { (async () => {
    try {
      const settingsSnap = await getDocs(collection(db, 'prayer_settings'));
      const doc0 = settingsSnap.docs.find(d => d.id === 'default') || settingsSnap.docs[0];
      const data = doc0 ? (doc0.data() as PrayerSettings) : null;
      setPageSize(data?.prayersPerPage || PAGE_SIZE_FALLBACK);
      setMotifColors(data?.motifColors || {});
      setAllowUnpray(!!data?.allowUnpray);
      setHideArchivedOnWall(data?.hideArchivedOnWall ?? true);
    } catch {}
  })(); }, []);

  // Recarregar a listagem quando a configuração de quantidade de cards mudar
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    load(true);
  }, [pageSize]);

  // Listener em tempo real: remove/atualiza/adiciona cards imediatamente quando houver mudanças
  useEffect(() => {
    const baseCol = collection(db, 'prayers');
    const clauses: any[] = [];
    if (mode === 'public') {
      const statusList = hideArchivedOnWall ? ['approved', 'active'] : ['approved', 'active', 'archived'];
      clauses.push(where('status', 'in', statusList));
    }
    if (mode === 'mine') {
      const uid = (user?.firebaseUid || user?.id || firebaseUser?.uid);
      // Sem UID: não assina listener (evita listar de outros usuários)
      if (!uid) {
        return;
      }
      clauses.push(where('ownerUserId', '==', uid));
    }
    if (filters.motif && filters.motif !== 'todos') clauses.push(where('motif', '==', filters.motif));

    const qRef = query(baseCol, ...clauses, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const list: PrayerRequest[] = [] as any;
        snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
        setItems(list);
        setHasMore(list.length >= pageSize);
      },
      (error) => {
        console.error('[PrayerCards] onSnapshot erro', error);
      }
    );
    return () => unsub();
  }, [mode, user, firebaseUser, filters.motif, filters.search, filters.dateFilterType, filters.dateFilterValue, hideArchivedOnWall, pageSize]);

  const formatDateTime = (cr: any) => {
    try {
      const v: any = cr;
      if (!v) return '-';
      if (typeof v?.toDate === 'function') return v.toDate().toLocaleString('pt-BR');
      if (v.seconds) return new Date(v.seconds * 1000).toLocaleString('pt-BR');
      if (typeof v === 'number') return new Date(v).toLocaleString('pt-BR');
      return new Date(v).toLocaleString('pt-BR');
    } catch { return '-'; }
  };

  const onOpenPopup = (item: PrayerRequest) => {
    const isAdmin = (user?.role === 'admin');
    // Bloqueia abertura do pop-up para não-admin em cards arquivados no mural público
    if (mode === 'public' && item.status === 'archived' && !isAdmin) {
      showToast('info', 'Deus já respondeu a este pedido, mas agradecemos por sua oração e intenção. ');
      return;
    }
    // Requer senha para administradores ao abrir card privado no mural público
    if (mode === 'public' && item.isPrivate) {
      if (!isAdmin) {
        showToast('info', 'Pedido privado');
        return;
      }
      const pwdEv = new CustomEvent('prayers:open:private:password', { detail: { id: item.id } });
      window.dispatchEvent(pwdEv);
      return;
    }
    const ev = new CustomEvent('prayers:open', { detail: { id: item.id, mode } });
    window.dispatchEvent(ev);
  };

  const onPray = async (item: PrayerRequest) => {
    try {
      if (busyIds.has(item.id)) return;
      setBusyIds(prev => new Set(prev).add(item.id));
      // Exige usuário autenticado (Firebase ou usuário mapeado)
      if (!(user || firebaseUser)) {
        showToast('info', 'Para indicar que está orando por um pedido, faça login com sua conta.');
        return;
      }
      // Bloqueia oração em pedidos já respondidos
      if (item.status === 'archived') {
        showToast('info', 'Deus já respondeu a este pedido');
        return;
      }
      // Sempre usar UID do Firebase para obedecer às regras do Firestore
      const uid = (user?.firebaseUid || firebaseUser?.uid)!;
      const has = (item.prayedBy || []).includes(uid!);
      if (has) {
        if (!allowUnpray) {
          showToast('warning', 'Você já está orando por este pedido.');
          return;
        }
        // UI otimista
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, prayedBy: (p.prayedBy||[]).filter(x => x !== uid), prayCount: Math.max(0, (p.prayCount||0)-1) } : p));
        await updateDoc(doc(db, 'prayers', item.id), { prayedBy: arrayRemove(uid), prayCount: increment(-1) });
      } else {
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, prayedBy: [...(p.prayedBy||[]), uid!], prayCount: (p.prayCount||0)+1 } : p));
        await updateDoc(doc(db, 'prayers', item.id), { prayedBy: arrayUnion(uid), prayCount: increment(1) });
      }
    } catch (err) { console.error(err); }
    finally {
      setBusyIds(prev => { const n = new Set(prev); n.delete(item.id); return n; });
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="mdo-prayer-cards-container">
        {items.map(it => (
          <div key={it.id} className="mdo-prayer-card relative bg-jkd-bg-sec border border-jkd-border rounded-lg p-3 cursor-pointer hover:border-church-primary/60" data-prayer-id={it.id} onClick={() => onOpenPopup(it)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            {/* Sobreposição “Deus Respondeu” cobrindo todo o card com vidro jateado */}
            {it.status === 'archived' && (
              <div
                className="mdo-god-answered-overlay absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <div
                  className={"rotate-[-10deg] px-6 py-2 border-2 border-dashed font-semibold text-lg shadow-sm rounded-md backdrop-blur-sm border-white text-white"}
                  style={{ backgroundColor: 'rgb(var(--church-primary) / 0.4)' }}
                >
                  Deus Respondeu!
                </div>
              </div>
            )}
            {/* Sobreposição de privacidade no mural público quando aprovado/ativo */}
            {mode === 'public' && it.isPrivate && (
              <div className="absolute inset-0 z-10 rounded-lg bg-jkd-bg/35 backdrop-blur-sm border border-jkd-border/50 pointer-events-none" />
            )}
            {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full h-32 object-cover rounded" draggable={false} onDragStart={(e)=>e.preventDefault()} />}
            {mode === 'public' && it.isPrivate && it.imageUrl && (
              <div className="absolute top-3 left-3 right-3 h-32 rounded z-[30] pointer-events-none backdrop-blur-[16px]" />
            )}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm text-jkd-text">
                <span className="font-semibold">{it.isPrivate ? 'Privado' : (it.hideName ? 'Reservado' : (it.name || 'Sem nome'))}</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-church-primary/10 text-church-primary text-xs">{motifLabel(it.motif)}</span>
              </div>
              {!it.isPrivate && (
                <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-jkd-border/40" onClick={(e)=>{ e.stopPropagation(); onPray(it); }}>
                  {(() => {
                    const uid = (user?.firebaseUid || firebaseUser?.uid) || null;
                    const filled = !!uid && (it.prayedBy || []).includes(uid);
                    const src = filled ? '/mural-de-oracao/assets/images/icons/heart-filled.svg' : '/mural-de-oracao/assets/images/icons/heart.svg';
                    return (<img src={src} alt="Orar" className="w-4 h-4" draggable={false} onDragStart={(e)=>e.preventDefault()} />);
                  })()}
                  <span className="mdo-prayer-count text-xs">{it.prayCount}</span>
                </button>
              )}
            </div>
            <div className="mt-1 text-xs text-jkd-text">{formatDateTime(it.createdAt)}</div>
            <p className="mt-2 text-sm text-jkd-text line-clamp-1">{it.isPrivate ? '********...' : it.text}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        {hasMore && (
          <button onClick={() => load(false)} disabled={loading} className="btn">
            {loading ? 'Carregando...' : 'Carregar Mais'}
          </button>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-jkd-text text-sm">Não há mais pedidos.</p>
        )}
        {!hasMore && items.length === 0 && (
          mode === 'mine' && !currentUid ? (
            <p className="text-jkd-text text-sm">Faça login para ver seus pedidos.</p>
          ) : (
            <p className="text-jkd-text text-sm">Nenhum pedido encontrado.</p>
          )
        )}
      </div>
    </div>
  );
};

export default PrayerCards;