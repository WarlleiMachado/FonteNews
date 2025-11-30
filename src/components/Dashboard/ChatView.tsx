import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Trash2, XCircle, Users, CheckCircle, Circle, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp, where, getCountFromServer, getDoc } from 'firebase/firestore';
import { ensureChatRoom, sendChatMessage, deleteChatMessage, clearChatMessages, clearChatMessagesOlderThanToday, pinChatForUser, clearChatForUser } from '../../services/firestoreService';
import SidePanelModern from '../ChatModern/SidePanelModern';
import ChatHeaderModern from '../ChatModern/ChatHeaderModern';
import ChatComposerModern from '../ChatModern/ChatComposerModern';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

const ChatView: React.FC = () => {
  const { user } = useAuth();
  const { authorizedUsers, onlineUserIds, ministryDepartments } = useApp();

  // Constantes configuráveis conforme calibração solicitada
  const PRE_ANALYSIS_DELAY_MS = Math.min(500, Math.max(300, 400)); // 300–500 ms (default 400)
  const SUPPRESSION_DURATION_MS = Math.min(5000, Math.max(1000, 3000)); // 1–5 s (default 3s)
  const FADE_IN_DURATION_MS = Math.min(5000, Math.max(1000, 2500)); // 1–5 s (default 2.5s)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [unseenByUserId, setUnseenByUserId] = useState<Record<string, boolean>>({});
  const [unreadCountByUserId, setUnreadCountByUserId] = useState<Record<string, number>>({});
  // Estados para exibição com atraso (1s) para evitar flicker de alertas
  const [uiUnseenByUserId, setUiUnseenByUserId] = useState<Record<string, boolean>>({});
  const [uiUnreadCountByUserId, setUiUnreadCountByUserId] = useState<Record<string, number>>({});
  // Suprime indicadores para um usuário recém-selecionado por um curto período
  const [ignoreUnseenUntil, setIgnoreUnseenUntil] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [pinnedByMe, setPinnedByMe] = useState<Record<string, boolean>>({});
  const [lastMessageAtByUserId, setLastMessageAtByUserId] = useState<Record<string, number>>({});
  const [selectedPinned, setSelectedPinned] = useState<boolean>(false);
  const [clearUntilAt, setClearUntilAt] = useState<Date | null>(null);
  // Abas e filtros do painel lateral (protótipo)
  const [activeTab, setActiveTab] = useState<'privates' | 'groups' | 'members'>('privates');
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);

  const activeUsers = useMemo(() => {
    return authorizedUsers
      .filter(u => u.status === 'active' && u.id !== (user?.id || ''))
      .sort((a, b) => {
        const aOnline = onlineUserIds.includes(a.id) ? 1 : 0;
        const bOnline = onlineUserIds.includes(b.id) ? 1 : 0;
        if (aOnline !== bOnline) return bOnline - aOnline;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [authorizedUsers, onlineUserIds, user]);

  // Mapa de ministérios/departamentos por usuário para suportar busca
  const userGroupsById = useMemo(() => {
    const map: Record<string, string[]> = {};
    ministryDepartments.forEach(g => {
      (g.leaderIds || []).forEach(uid => {
        if (!map[uid]) map[uid] = [];
        map[uid].push(g.name || '');
      });
    });
    return map;
  }, [ministryDepartments]);

  const displayUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = selectedGroupIds.length
      ? activeUsers.filter(u => selectedGroupIds.some(gid => {
          const g = ministryDepartments.find(x => x.id === gid);
          return !!g && (g.leaderIds || []).includes(u.id);
        }))
      : activeUsers;
    const filtered = !q ? base : base.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const groups = (userGroupsById[u.id] || []).map(n => n.toLowerCase());
      return name.includes(q) || email.includes(q) || groups.some(n => n.includes(q));
    });
    // Filtros adicionais do protótipo
    const filteredByOnline = onlineOnly ? filtered.filter(u => onlineUserIds.includes(u.id)) : filtered;
    const filteredByUnread = unreadOnly ? filteredByOnline.filter(u => (uiUnreadCountByUserId[u.id] || 0) > 0 || !!uiUnseenByUserId[u.id]) : filteredByOnline;
    const sorted = filteredByUnread.slice().sort((a, b) => {
      const pa = pinnedByMe[a.id] ? 1 : 0;
      const pb = pinnedByMe[b.id] ? 1 : 0;
      if (pa !== pb) return pb - pa;
      const ua = uiUnreadCountByUserId[a.id] || 0;
      const ub = uiUnreadCountByUserId[b.id] || 0;
      if (ua !== ub) return ub - ua;
      const la = lastMessageAtByUserId[a.id] || 0;
      const lb = lastMessageAtByUserId[b.id] || 0;
      if (la !== lb) return lb - la;
      const aOnline = onlineUserIds.includes(a.id) ? 1 : 0;
      const bOnline = onlineUserIds.includes(b.id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      return (a.name || '').localeCompare(b.name || '');
    });
    return sorted;
  }, [activeUsers, searchQuery, userGroupsById, selectedGroupIds, ministryDepartments, pinnedByMe, uiUnreadCountByUserId, lastMessageAtByUserId, onlineUserIds, onlineOnly, unreadOnly]);

  const isSelectedUserOnline = selectedUserId ? onlineUserIds.includes(selectedUserId) : false;

  // Assina conversas do usuário e calcula contagem de não vistas de forma estável
  useEffect(() => {
    if (!user?.id) return;
    const chatsRef = collection(db, 'chats');
    const qChats = query(chatsRef, where('participants', 'array-contains', user.id));
    const unsub = onSnapshot(qChats, async (snap) => {
      const nextUnseen: Record<string, boolean> = {};
      const nextCounts: Record<string, number> = {};
      const nextPinned: Record<string, boolean> = {};
      const nextLastAt: Record<string, number> = {};
      const tasks: Promise<void>[] = [];

      snap.forEach(d => {
        const data: any = d.data();
        const participants: string[] = data.participants || [];
        const otherId = participants.find(p => p !== user.id);
        if (!otherId) return;

        // Pinned and last message time
        nextPinned[otherId] = !!(data.pinnedBy?.[user.id]);
        const rawLast = data.lastMessageAt;
        const lastDate = rawLast?.toDate ? rawLast.toDate() : (rawLast instanceof Date ? rawLast : undefined);
        nextLastAt[otherId] = lastDate ? lastDate.getTime() : 0;

        // Se a conversa está aberta, suprime qualquer indicador localmente
        if (selectedUserId && otherId === selectedUserId) {
          nextUnseen[otherId] = false;
          nextCounts[otherId] = 0;
          return;
        }

        // Se foi selecionado recentemente, suprime indicadores por tempo limitado
        const suppressUntil = ignoreUnseenUntil[otherId];
        if (suppressUntil && Date.now() < suppressUntil) {
          nextUnseen[otherId] = false;
          nextCounts[otherId] = 0;
          return;
        }

        // Normaliza data de última visualização
        const rawLastViewed = data.lastViewed?.[user.id];
        const lastViewedAt = rawLastViewed?.toDate ? rawLastViewed.toDate() : (rawLastViewed instanceof Date ? rawLastViewed : undefined);

        tasks.push((async () => {
          try {
            const msgsRef = collection(db, 'chats', d.id, 'messages');
            const qCount = lastViewedAt
              ? query(msgsRef, where('senderId', '==', otherId), where('createdAt', '>', lastViewedAt))
              : query(msgsRef, where('senderId', '==', otherId));
            const agg = await getCountFromServer(qCount);
            const count = (agg.data() as any).count || 0;
            nextCounts[otherId] = count;
            nextUnseen[otherId] = count > 0;
          } catch (e) {
            console.warn('Falha ao obter contagem de não vistas para', otherId, e);
            nextCounts[otherId] = 0;
            nextUnseen[otherId] = false;
          }
        })());
      });

      try { await Promise.all(tasks); } catch {}
      setUnseenByUserId(nextUnseen);
      setUnreadCountByUserId(nextCounts);
      setPinnedByMe(nextPinned);
      setLastMessageAtByUserId(nextLastAt);
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.id, selectedUserId]);

  // Aplica atraso mínimo de 0.1s para exibir indicadores na UI
  useEffect(() => {
    const timer = setTimeout(() => {
      setUiUnseenByUserId(unseenByUserId);
      setUiUnreadCountByUserId(unreadCountByUserId);
    }, 100);
    return () => clearTimeout(timer);
  }, [unseenByUserId, unreadCountByUserId]);

  useEffect(() => {
    let unsub: any = null;
    const run = async () => {
      if (!user || !selectedUserId) return;
      const roomId = await ensureChatRoom(user.id, selectedUserId);
      setChatId(roomId);
      const chatRef = doc(db, 'chats', roomId);
      try {
        const snap = await getDoc(chatRef);
        const data: any = snap.data();
        const pinned = !!(data?.pinnedBy?.[user.id]);
        const rawClear = data?.clearUntil?.[user.id];
        const cu = rawClear?.toDate ? rawClear.toDate() : (rawClear instanceof Date ? rawClear : null);
        setSelectedPinned(pinned);
        setClearUntilAt(cu);
        setPinnedByMe(prev => ({ ...prev, [selectedUserId]: pinned }));
      } catch {}
      const msgsRef = collection(db, 'chats', roomId, 'messages');
      const q = query(msgsRef, orderBy('createdAt', 'asc'));
      unsub = onSnapshot(q, async (snap) => {
        const all: ChatMessage[] = snap.docs.map(d => {
          const data: any = d.data();
          return {
            id: d.id,
            senderId: data.senderId,
            text: data.text,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        });
        const next = clearUntilAt ? all.filter(m => m.createdAt > clearUntilAt) : all;
        setMessages(next);

        // Marca a conversa como visualizada para o usuário atual
        try {
          const chatRefInner = doc(db, 'chats', roomId);
          await updateDoc(chatRefInner, {
            [`lastViewed.${user.id}`]: serverTimestamp(),
          });
        } catch (e) {
          console.warn('⚠️ Falha ao marcar conversa como vista:', e);
        }
      });
    };
    run();
    return () => { if (unsub) try { unsub(); } catch {} };
  }, [user, selectedUserId, clearUntilAt]);

  const handleSend = async () => {
    if (!user || !selectedUserId || !chatId) return;
    const text = input.trim();
    if (!text) return;
    await sendChatMessage(chatId, user.id, text);
    setInput('');
  };

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
    // Ao focar em grupos, garantir que nenhuma conversa privada esteja ativa
    setSelectedUserId(null);
    setActiveTab('groups');
  };

  const handleSendGroup = async () => {
    if (!user) return;
    const text = input.trim();
    if (!text || selectedGroupIds.length === 0) return;
    const memberIds = Array.from(new Set(
      selectedGroupIds.flatMap(gid => {
        const g = ministryDepartments.find(x => x.id === gid);
        return g ? (g.leaderIds || []) : [];
      })
    )).filter(uid => uid !== user.id);

    for (const uid of memberIds) {
      try {
        const roomId = await ensureChatRoom(user.id, uid);
        await sendChatMessage(roomId, user.id, text);
      } catch (e) {
        console.warn('Falha ao enviar mensagem de grupo para', uid, e);
      }
    }
    setInput('');
  };

  const handleDeleteMsg = async (messageId: string) => {
    if (!chatId) return;
    await deleteChatMessage(chatId, messageId);
  };

  const handleClearAll = async () => {
    if (!chatId) return;
    await clearChatMessages(chatId);
  };

  const handleClearOlderThanToday = async () => {
    if (!chatId) return;
    await clearChatMessagesOlderThanToday(chatId);
  };

  const handleTogglePinSelected = async () => {
    if (!chatId || !user || !selectedUserId) return;
    try {
      await pinChatForUser(chatId, user.id, !selectedPinned);
      setSelectedPinned(!selectedPinned);
      setPinnedByMe(prev => ({ ...prev, [selectedUserId]: !selectedPinned }));
    } catch (e) {
      console.warn('Falha ao alternar pin da conversa:', e);
    }
  };

  const handleClearForMe = async () => {
    if (!chatId || !user) return;
    try {
      await clearChatForUser(chatId, user.id);
      setClearUntilAt(new Date());
    } catch (e) {
      console.warn('Falha ao limpar conversa para mim:', e);
    }
  };

  const handleSelectUser = async (targetUserId: string) => {
    if (!user?.id) return;
    try {
      // Pré-análise: garante sala e lê estado de última visualização para evitar indecisão
      const roomId = await ensureChatRoom(user.id, targetUserId);
      const chatRef = doc(db, 'chats', roomId);
      try { await getDoc(chatRef); } catch {}
      // Pequeno atraso para deixar a análise estabilizar antes de atualizar a UI
      await new Promise(resolve => setTimeout(resolve, PRE_ANALYSIS_DELAY_MS));
    } catch {}

    // Suprime indicadores para o usuário clicado por período configurável
    setIgnoreUnseenUntil(prev => ({ ...prev, [targetUserId]: Date.now() + SUPPRESSION_DURATION_MS }));

    // Atualiza seleção e zera indicadores locais do usuário clicado
    setSelectedUserId(targetUserId);
    setUnseenByUserId(prev => ({ ...prev, [targetUserId]: false }));
    setUnreadCountByUserId(prev => ({ ...prev, [targetUserId]: 0 }));
    setUiUnseenByUserId(prev => ({ ...prev, [targetUserId]: false }));
    setUiUnreadCountByUserId(prev => ({ ...prev, [targetUserId]: 0 }));
  };

  return (
    <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border flex flex-col lg:flex-row min-h-[520px] w-full overflow-hidden">
      {/* Lista de usuários */}
      <SidePanelModern
        users={displayUsers}
        selectedUserId={selectedUserId}
        uiUnreadCountByUserId={uiUnreadCountByUserId}
        uiUnseenByUserId={uiUnseenByUserId}
        onlineUserIds={onlineUserIds}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        ministryDepartments={ministryDepartments}
        selectedGroupIds={selectedGroupIds}
        onToggleGroup={handleToggleGroup}
        onSelectUser={handleSelectUser}
        // Novas props para UI estilo protótipo
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onlineOnly={onlineOnly}
        unreadOnly={unreadOnly}
        onToggleOnlineOnly={() => setOnlineOnly(v => !v)}
        onToggleUnreadOnly={() => setUnreadOnly(v => !v)}
      />
      {/* Conversa */}
      <main className="w-full lg:w-2/3 p-4 flex flex-col min-w-0">
        {!selectedUserId ? (
          <>
            <div className="flex-1 flex items-center justify-center text-jkd-text">
              <div className="text-center">
                <MessageCircle className="mx-auto mb-2" />
                <div className="text-sm">Selecione um líder para iniciar o chat ou escolha Ministérios/Departamentos para enviar uma mensagem em grupo.</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendGroup(); }}
                  placeholder={selectedGroupIds.length ? 'Mensagem para membros selecionados...' : 'Selecione Ministérios/Departamentos para enviar ao grupo'}
                  className="flex-1 min-w-0 bg-jkd-bg border border-jkd-border rounded-md px-3 py-2 text-sm text-jkd-heading focus:outline-none focus:ring-2 focus:ring-church-primary"
                />
                <button
                  onClick={handleSendGroup}
                  className="px-4 py-2 rounded-md bg-church-primary text-white text-sm font-semibold hover:bg-church-primary/90"
                  disabled={!input.trim() || selectedGroupIds.length === 0}
                >Enviar ao Grupo</button>
              </div>
              <div className="mt-2 text-xs text-jkd-text">O envio em grupo cria conversas individuais com cada membro selecionado.</div>
            </div>
          </>
        ) : (
          <>
            <ChatHeaderModern
              selectedUser={authorizedUsers.find(u => u.id === selectedUserId!)}
              isSelectedUserOnline={isSelectedUserOnline}
              selectedPinned={selectedPinned}
              onTogglePinSelected={handleTogglePinSelected}
              onClearForMe={handleClearForMe}
              onClearOlderThanToday={handleClearOlderThanToday}
              onClearAll={handleClearAll}
            />

            {!isSelectedUserOnline && (
              <div className="mb-3 p-2 rounded bg-yellow-100 text-yellow-800 text-sm">Líder off-line. Mensagens serão entregues quando ficar online.</div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              {messages.map(m => {
                const isMine = m.senderId === (user?.id || '');
                return (
                  <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-lg border ${isMine ? 'bg-church-primary/10 border-church-primary text-church-primary' : 'bg-jkd-bg border-jkd-border text-jkd-heading'}`}>
                      <div className="text-sm">{m.text}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="text-[11px] text-jkd-text">{m.createdAt.toLocaleTimeString()}</div>
                        {isMine && (
                          <button className="text-[11px] text-red-600 hover:text-red-700 inline-flex items-center gap-1" onClick={() => handleDeleteMsg(m.id)}>
                            <Trash2 size={12} /> Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center text-sm text-jkd-text py-6">Nenhuma mensagem ainda.</div>
              )}
            </div>

            <ChatComposerModern
              value={input}
              onChange={setInput}
              onSend={handleSend}
              placeholder={isSelectedUserOnline ? 'Digite sua mensagem...' : 'Líder off-line'}
              disabled={!input.trim()}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default ChatView;