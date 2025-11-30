import React, { useEffect, useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc, getDocs, where, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { PrayerRequest } from '../../types';
import { X, CheckCircle } from 'lucide-react';
import { motifLabel } from '../../utils/motifs';
import { useToast } from '../../contexts/ToastContext';

const PrayerPopup: React.FC = () => {
  const { user, firebaseUser, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [openMode, setOpenMode] = useState<'public' | 'mine'>('public');
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState<PrayerRequest | null>(null);
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; userName: string; text: string; createdAt?: any }>>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  // Bloqueio invisível de linguagem inadequada
  const [showProfanityWarning, setShowProfanityWarning] = useState(false);
  const profanityTimerRef = useRef<any>(null);
  const prohibitedPatterns: RegExp[] = [
    /\bporra\b/i,
    /\bcaralh\w*\b/i,
    /\bmerd\w*\b/i,
    /\bputa\w*\b/i,
    /\bbucet\w*\b/i,
    /\bcuz?\w*\b/i,
    /\bcu\b/i,
    /\bfod[ea]\w*\b/i,
    /\bfoda-?se\b/i,
    /\bviad\w*\b/i,
    /\bbich\w*\b/i,
    /\botári\w*\b/i,
    /\bidiot\w*\b/i,
    /\bimbecil\b/i,
    /\bburr[oa]\b/i,
    /\barrombad\w*\b/i,
    /\bdesgrac\w*\b/i,
    /\bmaldit\w*\b/i,
    /\bpqp\b/i,
    /\bporn[oô]\w*\b/i,
    /\bsexo\b/i,
    /\bpenis\b/i,
    /\bpênis\b/i,
    /\bvagin\w*\b/i,
    /\bboquet\w*\b/i,
    /\bpunhet\w*\b/i,
  ];
  const stripAccents = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const containsProhibited = (s: string) => {
    if (!s || !s.trim()) return false;
    const t = stripAccents(s);
    return prohibitedPatterns.some(r => r.test(s) || r.test(t));
  };
  const showProfanity = () => {
    setShowProfanityWarning(true);
    try { if (profanityTimerRef.current) clearTimeout(profanityTimerRef.current); } catch {}
    profanityTimerRef.current = setTimeout(() => setShowProfanityWarning(false), 10000);
  };
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentText(val);
    if (containsProhibited(val)) showProfanity();
  };

  useEffect(() => {
    const onOpen = (e: any) => { setOpenId(e.detail.id); if (e.detail.mode) setOpenMode(e.detail.mode); };
    window.addEventListener('prayers:open', onOpen as any);
    return () => window.removeEventListener('prayers:open', onOpen as any);
  }, []);

  useEffect(() => { (async () => {
    if (!openId) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'prayers', openId));
      if (snap.exists()) setItem({ id: snap.id, ...(snap.data() as any) });
    } finally { setLoading(false); }
  })(); }, [openId]);

  // Comentários em tempo real enquanto o popup está aberto
  useEffect(() => {
    if (!openId) return;
    setCommentsLoading(true);
    const baseCol = collection(db, 'prayer_comments');
    let unsub: (() => void) | null = null;

    const subscribeWithoutOrder = () => {
      const q = query(baseCol, where('prayerId', '==', openId!));
      unsub = onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
        // Ordena client-side por createdAt
        list.sort((a, b) => {
          const va: any = a.createdAt;
          const vb: any = b.createdAt;
          const ta = va?.seconds ? va.seconds * 1000 : (va instanceof Date ? va.getTime() : (va ? new Date(va).getTime() : 0));
          const tb = vb?.seconds ? vb.seconds * 1000 : (vb instanceof Date ? vb.getTime() : (vb ? new Date(vb).getTime() : 0));
          return ta - tb;
        });
        setComments(list);
        setCommentsLoading(false);
      }, () => { setCommentsLoading(false); });
    };

    const subscribeWithOrder = () => {
      const q = query(baseCol, where('prayerId', '==', openId!), orderBy('createdAt', 'asc'));
      unsub = onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
        const list: any[] = [];
        snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
        setComments(list);
        setCommentsLoading(false);
      }, (err) => {
        // Se erro (ex.: índice composto ausente), cai para assinatura sem orderBy
        console.warn('onSnapshot(prayer_comments) com orderBy falhou, usando fallback:', err?.message || err);
        try { unsub && unsub(); } catch {}
        subscribeWithoutOrder();
      });
    };

    subscribeWithOrder();
    return () => { try { unsub && unsub(); } catch {} };
  }, [openId]);

  const close = () => { setOpenId(null); setItem(null); setCommentText(''); };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !commentText.trim()) return;
    // Bloqueia uso de linguagem inadequada
    if (containsProhibited(commentText)) { showProfanity(); return; }
    // Bloqueia comentário de usuário anônimo e orienta a fazer login
    if (!firebaseUser && !user) {
      showToast('warning', 'Por gentileza faça Login para poder comentar em Pedidos de Oração');
      return;
    }
    const displayName = (user?.name || firebaseUser?.displayName || 'usuário anônimo');
    // Para cumprir regras do Firestore: se autenticado, userId deve ser exatamente o UID do Firebase
    const displayUid = (firebaseUser?.uid || user?.firebaseUid || null);
    try {
      const newPayload = {
        prayerId: item.id,
        userId: displayUid,
        userName: displayName,
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, 'prayer_comments'), newPayload);
      // Limpa o campo após envio; a lista será atualizada pelo onSnapshot
      setCommentText('');
      setCommentsLoading(false);
    } catch (err: any) {
      console.error('Falha ao adicionar comentário:', err);
      setCommentsLoading(false);
    }
  };

  const markGodAnswered = async () => {
    if (!item) return;
    const uid = (user?.firebaseUid || user?.id || firebaseUser?.uid);
    if (!uid || uid !== item.ownerUserId) return;
    try {
      if (item.status === 'archived') {
        // Reverter para status anterior, quando disponível; senão, volta para 'approved'
        const snap = await getDoc(doc(db, 'prayers', item.id));
        const prev = snap.exists() ? ((snap.data() as any).prevStatus || 'approved') : 'approved';
        await updateDoc(doc(db, 'prayers', item.id), { status: prev, prevStatus: null });
        setItem({ ...item, status: prev });
        showToast('success', 'Marcado como não respondido.');
      } else {
        await updateDoc(doc(db, 'prayers', item.id), { status: 'archived', prevStatus: item.status });
        setItem({ ...item, status: 'archived' });
        showToast('success', 'Marcado como respondido.');
      }
    } catch (err: any) {
      console.error('Falha ao atualizar status:', err);
      let msg = 'Erro ao atualizar status.';
      if (err?.code === 'permission-denied') msg = 'Permissão negada. Faça login.';
      if (err?.code === 'unauthenticated') msg = 'Sessão expirada. Faça login novamente.';
      showToast('error', msg);
    }
  };

  if (!openId) return null;

  return (
    <div id="mdo-prayer-popup-overlay" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={close}>
      <div id="mdo-prayer-popup-modal" className="relative bg-jkd-bg-sec border border-jkd-border rounded-lg max-w-5xl w-full p-4 max-h-[85vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-jkd-heading">Detalhes do Pedido</h3>
          <button onClick={close} className="p-2 text-jkd-text hover:text-church-primary"><X size={18} /></button>
        </div>
        {loading && <p className="text-jkd-text py-8 text-center">Carregando...</p>}
        {!loading && item && (
          (() => {
            const isAdmin = (user?.role === 'admin');
            const isOwner = ((user?.firebaseUid || firebaseUser?.uid) ?? '') === (item.ownerUserId ?? '');
            const blocked = (openMode === 'public' && item.isPrivate && !isAdmin);
            if (blocked) {
              return (
                <div className="mt-3 p-4 rounded border border-jkd-border bg-jkd-bg text-jkd-text">
                  <p className="font-semibold">Pedido privado</p>
                  <p className="text-sm mt-1">Este pedido é privado. Apenas administradores podem visualizar o conteúdo.</p>
                  <p className="text-sm mt-1">Se este é seu pedido, acesse "Meus pedidos" para visualizar com segurança.</p>
                </div>
              );
            }
            return (
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Painel esquerdo: dados iniciais do pedido */}
                 <div>
                   <div className="text-sm text-jkd-text">
                     <span className="font-semibold">{item.isPrivate ? 'Privado' : (item.hideName ? 'Reservado' : item.name)}</span>
                     <span className="ml-2 px-2 py-0.5 rounded bg-church-primary/10 text-church-primary text-xs">{motifLabel(item.motif)}</span>
                     {item.status === 'archived' && (
                       <span className="ml-2 px-2 py-0.5 rounded bg-yellow-600/10 text-yellow-700 text-xs">Deus Respondeu</span>
                     )}
                   </div>
                   {(() => {
                     const uid = (user?.firebaseUid || firebaseUser?.uid) || null;
                     const isPraying = !!uid && (item.prayedBy || []).includes(uid);
                     if (uid && isPraying) {
                       return (
                         <div className="mt-3 px-3 py-2 rounded-md bg-green-600/10 text-green-800 text-sm border border-green-300/30">
                           Você já está orando por este pedido.
                         </div>
                       );
                     }
                     if (uid && !isPraying) {
                       return (
                         <div className="mt-3 px-3 py-2 rounded-md bg-church-primary/10 text-church-primary text-sm border border-church-primary/20">
                           Para indicar que está orando, clique no coração no card.
                         </div>
                       );
                     }
                     return null;
                   })()}
                   <p className="mt-3 text-jkd-text whitespace-pre-wrap">{item.text}</p>

                   <div className="mt-4 flex flex-wrap items-center gap-3">
                     {(() => {
                       // Helpers para blindar os botões de compartilhamento
                       const buildUrl = () => `${window.location.origin}/site/pedido-de-oracao?prayer_id=${item.id}#mdo-open-${item.id}`;
                       const buildText = () => item.text.slice(0, 120);
                       const copyLink = async () => {
                         try {
                           await navigator.clipboard.writeText(buildUrl());
                           setCopied(true);
                           setTimeout(() => setCopied(false), 2000);
                         } catch {}
                       };
                       const nativeShare = async () => {
                         const url = buildUrl();
                         const text = buildText();
                         try {
                           if ((navigator as any)?.share) {
                             await (navigator as any).share({ title: 'Pedido de Oração', text, url });
                           } else {
                             await copyLink();
                           }
                         } catch {}
                       };
                       const waHref = `https://wa.me/?text=${encodeURIComponent(buildText()+" "+buildUrl())}`;
                       const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(buildUrl())}`;

                       return (
                         <>
                           <button className="px-3 py-2 rounded-md bg-jkd-bg border border-jkd-border text-jkd-text flex items-center gap-1" onClick={copyLink}>
                             <img src="/mural-de-oracao/assets/images/icons/link.svg" alt="Copiar" className="w-4 h-4" /> Copiar
                           </button>
                           <button className="px-3 py-2 rounded-md bg-jkd-bg border border-jkd-border text-jkd-text flex items-center gap-1" onClick={nativeShare}>
                             <img src="/mural-de-oracao/assets/images/icons/share-native.svg" alt="Compartilhar" className="w-4 h-4" /> Compartilhar
                           </button>
                           <a className="px-3 py-2 rounded-md bg-jkd-bg border border-jkd-border text-jkd-text flex items-center gap-1" href={waHref} target="_blank" rel="noopener noreferrer">
                             <img src="/mural-de-oracao/assets/images/icons/whatsapp.svg" alt="WhatsApp" className="w-4 h-4" /> WhatsApp
                           </a>
                           <a className="px-3 py-2 rounded-md bg-jkd-bg border border-jkd-border text-jkd-text flex items-center gap-1" href={fbHref} target="_blank" rel="noopener noreferrer">
                             <img src="/mural-de-oracao/assets/images/icons/facebook.svg" alt="Facebook" className="w-4 h-4" /> Facebook
                           </a>
                         </>
                       );
                     })()}
                     {(openMode === 'mine' && (user?.firebaseUid || firebaseUser?.uid) === item.ownerUserId) && (
                       <div className="flex items-center gap-2">
                         <button
                           className={`px-3 py-2 rounded-md flex items-center gap-1 ${item.status === 'archived' ? 'bg-yellow-600/20 text-yellow-800 border border-yellow-600/30 hover:bg-yellow-600/30' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
                           onClick={markGodAnswered}
                           aria-pressed={item.status === 'archived'}
                           title="Marcar como respondido (clique novamente para reverter)"
                         >
                           <CheckCircle size={16} /> Deus Respondeu?
                         </button>
                         {item.status !== 'archived' && (
                           <span className="text-xs text-jkd-text">clique apenas se Deus já respondeu ao seu pedido</span>
                         )}
                       </div>
                     )}
                   </div>

                   {copied && (
                     <div className="mt-2 inline-block px-3 py-2 rounded bg-green-600 text-white text-sm">Link copiado com sucesso!</div>
                   )}

                   {item.imageUrl && (
                     <img src={item.imageUrl} alt="Imagem do pedido" className="mt-4 w-full rounded object-contain max-h-[40vh]" />
                   )}

                   {!!item.wantsVisit && item.address && (
                     (() => {
                       const isOwner = ((user?.firebaseUid || firebaseUser?.uid) ?? '') === (item.ownerUserId ?? '');
                       const isAdmin = (user?.role === 'admin');
                       const showVisit = (openMode === 'mine' && isOwner) || (openMode === 'public' && isAdmin);
                       if (!showVisit) return null;
                       return (
                         <div className="mt-4 border border-jkd-border rounded p-3 bg-jkd-bg">
                           <p className="text-sm font-semibold text-jkd-heading flex items-center gap-2">
                             <img src="/mural-de-oracao/assets/images/icons/visit.svg" alt="Visita" className="w-4 h-4" /> Informações de Visita:
                           </p>
                           <div className="mt-2 text-sm text-jkd-text">
                             {item.address.street && <p>Rua: {item.address.street}</p>}
                             {item.address.number && <p>Número: {item.address.number}</p>}
                             {item.address.district && <p>Bairro: {item.address.district}</p>}
                             {(item.address.city || item.address.state) && <p>{item.address.city || ''} {item.address.state ? `- ${item.address.state}` : ''}</p>}
                             {(openMode === 'mine' && isOwner) && <p className="text-xs text-jkd-text/80 mt-1">Seus dados pessoais estão visíveis porque você está logado.</p>}
                           </div>
                         </div>
                       );
                     })()
                   )}
                 </div>

                 {/* Painel direito: comentários */}
                 <div>
                   <div className="text-sm text-jkd-text">Comentários</div>
                   {commentsLoading ? (
                     <p className="text-jkd-text">Carregando...</p>
                   ) : (
                     <div className="mt-2 space-y-2">
                       {comments.length === 0 && <p className="text-jkd-text">Seja o primeiro a comentar.</p>}
                       {comments.map(c => (
                         <div key={c.id} className="bg-jkd-bg rounded border border-jkd-border p-2">
                           <div className="text-xs text-jkd-text">{c.userName || 'Anônimo'}</div>
                           <div className="text-sm text-jkd-heading whitespace-pre-wrap">{c.text}</div>
                         </div>
                       ))}
                     </div>
                   )}
                   <form onSubmit={addComment} className="mt-3 flex items-center gap-2">
                     <input value={commentText} onChange={handleCommentChange} placeholder="Escreva um comentário" className={`flex-1 px-3 py-2 rounded border bg-jkd-bg text-jkd-text ${containsProhibited(commentText) ? 'border-red-400' : 'border-jkd-border'}`} />
                     <button type="submit" className="px-3 py-2 rounded bg-church-primary text-white">Enviar</button>
                   </form>
                     {showProfanityWarning && (
                     <div className="fixed right-6 z-[1100] max-w-md rounded-xl border border-white/10 bg-black/80 text-white shadow-xl backdrop-blur px-4 py-3 safe-bottom-6">
                       <p className="text-sm">Este é um espaço de oração e comunhão.</p>
                       <p className="text-sm mt-1">Pedimos que suas palavras reflitam amor e respeito.</p>
                       <p className="text-sm mt-1">Comentários com ofensas, palavrões ou conteúdo inapropriado serão removidos, mantendo o respeito e a boa convivência.</p>
                     </div>
                   )}
                   {!user && !firebaseUser && (
                     <p className="mt-2 text-xs text-jkd-text">Para comentar, faça login.
                       <button type="button" className="ml-2 underline text-church-primary" onClick={loginWithGoogle}>Login com Google</button>
                     </p>
                   )}
                 </div>
               </div>
            );
           })()
         )}
      </div>
    </div>
  );
};

export default PrayerPopup;