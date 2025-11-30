import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import SidePanel from './components/SidePanel';
import MessageBubble from './components/MessageBubble';
import ChatInput from './components/ChatInput';
import Welcome from './components/Welcome';
import { ensureChatRoom, sendChatMessage, deleteChatMessage, clearChatMessages, clearChatMessagesOlderThanToday, clearChatForUser, pinChatMessageForUser, hideChatMessageForUser, ensureGroupChatRoom, sendGroupChatMessage, deleteGroupChatMessage, clearGroupChatMessages, clearGroupChatMessagesOlderThanToday, clearGroupChatForUser, pinGroupChatMessageForUser, hideGroupChatMessageForUser } from '../../services/firestoreService';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp, where, getCountFromServer, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, MessageCircle, Eraser, Trash2 } from 'lucide-react';
import Avatar from './components/ui/Avatar';
import { Link } from 'react-router-dom';

interface LiveMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt?: any;
}

const LiderChatPrototypeApp: React.FC = () => {
  const { user } = useAuth();
  const { authorizedUsers, ministryDepartments, onlineUserIds, settings } = useApp();

  const myId = user?.id || null;
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [groupChatId, setGroupChatId] = useState<string | null>(null);
  const [activeChatType, setActiveChatType] = useState<'user' | 'group' | null>(null);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [clearUntilAt, setClearUntilAt] = useState<Date | null>(null);
  const [unreadCountByUserId, setUnreadCountByUserId] = useState<Record<string, number>>({});
  const [unreadCountByGroupId, setUnreadCountByGroupId] = useState<Record<string, number>>({});
  const selectedUser = useMemo(() => authorizedUsers.find(u => u.id === selectedUserId) || null, [authorizedUsers, selectedUserId]);
  const selectedGroup = useMemo(() => ministryDepartments.find(g => g.id === selectedGroupId) || null, [ministryDepartments, selectedGroupId]);

// Mensagens visíveis (aplica clearUntil e hiddenBy)
const visibleMessages = useMemo(() => {
  return liveMessages.filter((m) => {
    const mm: any = m;
    const created = mm?.createdAt?.toDate ? mm.createdAt.toDate() : (typeof mm?.createdAt === 'number' ? new Date(mm.createdAt) : mm?.createdAt);
    const afterClear = clearUntilAt ? (!created || created > clearUntilAt) : true;
    const hidden = myId ? !!mm?.hiddenBy?.[myId] : false;
    return afterClear && !hidden;
  });
}, [liveMessages, clearUntilAt, myId]);

// Mensagens fixadas por mim
const pinnedMessages = useMemo(() => {
  return visibleMessages.filter((m) => {
    const mm: any = m;
    return myId ? !!mm?.pinnedBy?.[myId] : false;
  });
}, [visibleMessages, myId]);

// Mensagens regulares (não fixadas)
const regularMessages = useMemo(() => {
  const pinnedIds = new Set(pinnedMessages.map((m: any) => m.id));
  return visibleMessages.filter((m: any) => !pinnedIds.has(m.id));
}, [visibleMessages, pinnedMessages]);

  // Ensure chat room when selecting a user
  useEffect(() => {
    let canceled = false;
    async function run() {
      if (!myId || !selectedUserId) {
        setChatId(null);
        setLiveMessages([]);
        return;
      }
      try {
        const id = await ensureChatRoom(myId, selectedUserId);
        if (canceled) return;
        // Atualiza lastViewed imediatamente ao abrir a conversa
        try {
          await updateDoc(doc(db, 'chats', id), { [`lastViewed.${myId}`]: serverTimestamp() });
        } catch {}
        setChatId(id);
      } catch (err) {
        console.error('Falha ao garantir sala de chat', err);
      }
    }
    run();
    return () => { canceled = true; };
  }, [myId, selectedUserId]);

  // Ensure group chat room when selecting a group
  useEffect(() => {
    let canceled = false;
    async function run() {
      if (!myId || !selectedGroupId) {
        setGroupChatId(null);
        setLiveMessages([]);
        return;
      }
      try {
        const gid = await ensureGroupChatRoom(selectedGroupId);
        if (canceled) return;
        // Atualiza lastViewed imediatamente ao abrir o grupo
        try {
          await updateDoc(doc(db, 'groupChats', gid), { [`lastViewed.${myId}`]: serverTimestamp() });
        } catch {}
        setGroupChatId(gid);
        setActiveChatType('group');
      } catch (err) {
        console.error('Falha ao garantir sala de chat de grupo', err);
      }
    }
    run();
    return () => { canceled = true; };
  }, [myId, selectedGroupId]);

  // Listen messages for current chat
  useEffect(() => {
    if (!chatId) return;
    const msgsRef = collection(db, 'chats', chatId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, async (snap) => {
      const items: LiveMessage[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setLiveMessages(items);
      // Marca a conversa como visualizada pelo usuário atual (para limpar badges)
      if (myId) {
        try {
          const chatRef = doc(db, 'chats', chatId);
          await updateDoc(chatRef, { [`lastViewed.${myId}`]: serverTimestamp() });
        } catch {}
      }
    }, (err) => {
      console.error('Listener de mensagens falhou', err);
    });
    return () => unsub();
  }, [chatId, myId]);

  // Listen messages for current group chat
  useEffect(() => {
    if (!groupChatId) return;
    const msgsRef = collection(db, 'groupChats', groupChatId, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, async (snap) => {
      const items: LiveMessage[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setLiveMessages(items);
      // Marca o grupo como visualizado pelo usuário atual
      if (myId) {
        try {
          const chatRef = doc(db, 'groupChats', groupChatId);
          await updateDoc(chatRef, { [`lastViewed.${myId}`]: serverTimestamp() });
        } catch {}
      }
    }, (err) => {
      console.error('Listener de mensagens de grupo falhou', err);
    });
    return () => unsub();
  }, [groupChatId, myId]);

  // Buscar clearUntil para o usuário atual
  useEffect(() => {
    if (!chatId || !myId) return;
    (async () => {
      try {
        const chatSnap = await getDoc(doc(db, 'chats', chatId));
        const clear = chatSnap.data()?.clearUntil?.[myId];
        const d = clear?.toDate ? clear.toDate() : (clear instanceof Date ? clear : null);
        setClearUntilAt(d);
      } catch (err) {
        console.warn('Falha ao ler clearUntil', err);
      }
    })();
  }, [chatId, myId]);

  // Buscar clearUntil para o usuário atual em chat de grupo
  useEffect(() => {
    if (!groupChatId || !myId) return;
    (async () => {
      try {
        const chatSnap = await getDoc(doc(db, 'groupChats', groupChatId));
        const clear = chatSnap.data()?.clearUntil?.[myId];
        const d = clear?.toDate ? clear.toDate() : (clear instanceof Date ? clear : null);
        setClearUntilAt(d);
      } catch (err) {
        console.warn('Falha ao ler clearUntil (grupo)', err);
      }
    })();
  }, [groupChatId, myId]);

  // Contagens de novas mensagens por usuário (para badges verdes no SidePanel)
  useEffect(() => {
    if (!myId) return;
    const chatsRef = collection(db, 'chats');
    const qChats = query(chatsRef, where('participants', 'array-contains', myId));
    const unsub = onSnapshot(qChats, async (snap) => {
      const next: Record<string, number> = {};
      const tasks: Promise<void>[] = [];
      snap.forEach(d => {
        const data: any = d.data();
        const participants: string[] = data.participants || [];
        const otherId = participants.find(p => p !== myId);
        if (!otherId) return;
        // Se a conversa com este usuário está aberta, suprime o badge
        if (selectedUserId && otherId === selectedUserId) {
          next[otherId] = 0;
          return;
        }
        const rawLastViewed = data.lastViewed?.[myId];
        const lastViewedAt = rawLastViewed?.toDate ? rawLastViewed.toDate() : (rawLastViewed instanceof Date ? rawLastViewed : undefined);
        tasks.push((async () => {
          try {
            const msgsRef = collection(db, 'chats', d.id, 'messages');
            const qCount = lastViewedAt
              ? query(msgsRef, where('senderId', '==', otherId), where('createdAt', '>', lastViewedAt))
              : query(msgsRef, where('senderId', '==', otherId));
            const agg = await getCountFromServer(qCount);
            const cnt = (agg.data() as any).count || 0;
            next[otherId] = cnt;
          } catch {
            next[otherId] = 0;
          }
        })());
      });
      try {
        await Promise.all(tasks);
        setUnreadCountByUserId(next);
      } catch {
        setUnreadCountByUserId(next);
      }
    });
    return () => { try { unsub(); } catch {} };
  }, [myId, selectedUserId]);

  // Contagens de novas mensagens por grupo (para badges verdes no SidePanel)
  useEffect(() => {
    if (!myId) return;
    const next: Record<string, number> = {};
    const tasks: Promise<void>[] = [];
    ministryDepartments.forEach((g) => {
      tasks.push((async () => {
        try {
          // Se o grupo está aberto, suprimir badge
          if (selectedGroupId && selectedGroupId === g.id) {
            next[g.id] = 0;
            return;
          }
          const chatSnap = await getDoc(doc(db, 'groupChats', g.id));
          const data: any = chatSnap.data() || {};
          const rawLastViewed = data?.lastViewed?.[myId];
          const lastViewedAt = rawLastViewed?.toDate ? rawLastViewed.toDate() : (rawLastViewed instanceof Date ? rawLastViewed : undefined);
          const msgsRef = collection(db, 'groupChats', g.id, 'messages');
          const qCount = lastViewedAt ? query(msgsRef, where('createdAt', '>', lastViewedAt)) : msgsRef;
          const agg = await getCountFromServer(qCount);
          const cnt = (agg.data() as any).count || 0;
          next[g.id] = cnt;
        } catch {
          next[g.id] = 0;
        }
      })());
    });
    (async () => {
      try {
        await Promise.all(tasks);
        setUnreadCountByGroupId(next);
      } catch {
        setUnreadCountByGroupId(next);
      }
    })();
  }, [myId, ministryDepartments, selectedGroupId]);

  type Attachment = {
    type: 'image' | 'video' | 'audio' | 'pdf';
    url: string;
    storagePath?: string;
    name?: string;
  };
  
  const handleSend = async (text: string, attachments?: Attachment[]) => {
    if (!myId) return;
    try {
      if (activeChatType === 'user' && chatId) {
        await sendChatMessage(chatId, myId, text, attachments);
      } else if (activeChatType === 'group' && groupChatId) {
        await sendGroupChatMessage(groupChatId, myId, text, attachments);
      }
    } catch (err) {
      console.error('Falha ao enviar mensagem', err);
    }
  };

  const headerHeight = 56; // h-14
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [liveMessages.length, pinnedMessages.length]);

  // Overlay de aparência do chat
  const overlay = settings?.leaderChatAppearance || ({} as any);
  const overlayUrl = overlay?.overlayUploadUrl || overlay?.overlayImageUrl || '';
  const overlayStyle: React.CSSProperties = overlayUrl
    ? {
        backgroundImage: `url(${overlayUrl})`,
        backgroundRepeat: overlay?.overlayRepeat || 'no-repeat',
        backgroundSize: overlay?.overlaySize || 'cover',
        backgroundPosition: overlay?.overlayPosition || 'center',
        opacity: Math.max(0, Math.min(1, Number(overlay?.overlayOpacity ?? 0.15))),
        pointerEvents: 'none',
      }
    : {};

  return (
    <div className="min-h-[calc(100vh-56px)] grid grid-cols-1 sm:grid-cols-[320px_1fr] bg-light-bg dark:bg-dark-bg">
      {/* Side Panel */}
      <SidePanel
        users={authorizedUsers}
        groups={ministryDepartments}
        currentUserId={myId}
        selectedUserId={selectedUserId}
        selectedGroupId={selectedGroupId}
        onlineUserIds={onlineUserIds}
        unreadCountByUserId={unreadCountByUserId}
        unreadCountByGroupId={unreadCountByGroupId}
        onSelectUser={(uid) => { setSelectedUserId(uid); setSelectedGroupId(null); setGroupChatId(null); setActiveChatType('user'); }}
        onSelectGroup={(gid) => { setSelectedGroupId(gid); setSelectedUserId(null); setChatId(null); setLiveMessages([]); setActiveChatType('group'); }}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col">
        {/* Page header within chat container */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-jkd-border bg-light-bg dark:bg-dark-bg">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-church-primary" />
            <h1 className="text-xl font-bold text-light-heading dark:text-dark-heading">Líder-Chat</h1>
            {selectedUser && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-light-text dark:text-dark-text opacity-70">/</span>
                <Avatar src={selectedUser.avatarUrl} alt={selectedUser.name} size={28} isOnline={onlineUserIds.includes(selectedUser.id)} />
                <span className="text-sm text-light-text dark:text-dark-text opacity-70">{selectedUser.name}</span>
              </div>
            )}
            {!selectedUser && selectedGroup && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-light-text dark:text-dark-text opacity-70">/</span>
                <Avatar src={selectedGroup.logoUrl} alt={selectedGroup.name} size={28} />
                <span className="text-sm text-light-text dark:text-dark-text opacity-70">{selectedGroup.name}</span>
              </div>
            )}
            {selectedUser && chatId && myId && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text hover:bg-light-bg-muted/70 dark:hover:bg-dark-bg-muted/70"
                  title="Limpar para mim"
                  onClick={async () => {
                    try {
                      await clearChatForUser(chatId, myId);
                      const snap = await getDoc(doc(db, 'chats', chatId));
                      const clear = (snap.data() as any)?.clearUntil?.[myId];
                      const d = clear?.toDate ? clear.toDate() : (clear instanceof Date ? clear : null);
                      setClearUntilAt(d);
                    } catch (e) {
                      console.error('Falha ao limpar para mim', e);
                    }
                  }}
                >
                  <Eraser className="w-4 h-4" /> <span className="text-xs">Para mim</span>
                </button>
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text hover:bg-light-bg-muted/70 dark:hover:bg-dark-bg-muted/70"
                  title="Limpar mensagens de hoje (todos)"
                  onClick={async () => {
                    if (!chatId) return;
                    try { await clearChatMessagesOlderThanToday(chatId); } catch (e) { console.error('Falha ao limpar hoje', e); }
                  }}
                >
                  <Trash2 className="w-4 h-4" /> <span className="text-xs">Hoje</span>
                </button>
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text hover:bg-light-bg-muted/70 dark:hover:bg-dark-bg-muted/70"
                  title="Limpar tudo (todos)"
                  onClick={async () => {
                    if (!chatId) return;
                    try { await clearChatMessages(chatId); } catch (e) { console.error('Falha ao limpar tudo', e); }
                  }}
                >
                  <Trash2 className="w-4 h-4" /> <span className="text-xs">Tudo</span>
                </button>
              </div>
            )}
            {!selectedUser && selectedGroup && groupChatId && myId && (
              <div className="flex items-center gap-2 ml-4">
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text hover:bg-light-bg-muted/70 dark:hover:bg-dark-bg-muted/70"
                  title="Limpar para mim"
                  onClick={async () => {
                    try {
                      await clearGroupChatForUser(groupChatId, myId);
                      const snap = await getDoc(doc(db, 'groupChats', groupChatId));
                      const clear = (snap.data() as any)?.clearUntil?.[myId];
                      const d = clear?.toDate ? clear.toDate() : (clear instanceof Date ? clear : null);
                      setClearUntilAt(d);
                    } catch (e) {
                      console.error('Falha ao limpar para mim (grupo)', e);
                    }
                  }}
                >
                  <Eraser className="w-4 h-4" /> <span className="text-xs">Para mim</span>
                </button>
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text hover:bg-light-bg-muted/70 dark:hover:bg-dark-bg-muted/70"
                  title="Limpar mensagens de hoje (todos)"
                  onClick={async () => {
                    if (!groupChatId) return;
                    try { await clearGroupChatMessagesOlderThanToday(groupChatId); } catch (e) { console.error('Falha ao limpar hoje (grupo)', e); }
                  }}
                >
                  <Trash2 className="w-4 h-4" /> <span className="text-xs">Hoje</span>
                </button>
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text hover:bg-light-bg-muted/70 dark:hover:bg-dark-bg-muted/70"
                  title="Limpar tudo (todos)"
                  onClick={async () => {
                    if (!groupChatId) return;
                    try { await clearGroupChatMessages(groupChatId); } catch (e) { console.error('Falha ao limpar tudo (grupo)', e); }
                  }}
                >
                  <Trash2 className="w-4 h-4" /> <span className="text-xs">Tudo</span>
                </button>
              </div>
            )}
          </div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-church-primary hover:text-church-primary/80">
            <ArrowLeft size={18} />
            <span>Voltar ao Painel</span>
          </Link>
        </div>

        {/* Área de conteúdo e overlay */}
        <div className="relative flex-1 flex flex-col">
          {overlayUrl && <div className="absolute inset-0 z-0" style={overlayStyle} />}

          {/* Composer no topo */}
          <div className="border-b border-jkd-border relative z-10">
            <ChatInput onSend={handleSend} disabled={!myId || !(activeChatType === 'user' ? (chatId && selectedUser) : (groupChatId && selectedGroup))} />
          </div>

          {/* Chat content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 relative z-10" ref={contentRef} style={{ maxHeight: `calc(100vh - ${headerHeight}px - 48px - 48px)` }}>
            {!selectedUser && !selectedGroup && <Welcome />}
            {(selectedUser || selectedGroup) && (
              <div className="space-y-1">
                {pinnedMessages.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-light-text dark:text-dark-text opacity-80 mb-1">Fixadas</div>
                    <div className="space-y-1">
                      {pinnedMessages.map((m: any) => (
                        <MessageBubble
                          key={`pinned-${m.id}`}
                          text={m.text}
                          attachments={m.attachments || []}
                          timestamp={m.createdAt?.toDate ? m.createdAt.toDate().getTime() : undefined}
                          isMe={m.senderId === myId}
                          read={true}
                          pinned={true}
                          onTogglePin={() => {
                            if (!myId) return;
                            const isPinned = !!m?.pinnedBy?.[myId];
                            if (activeChatType === 'user' && chatId) {
                              pinChatMessageForUser(chatId, m.id, myId, !isPinned).catch(err => console.error('Falha ao alternar pin', err));
                            } else if (activeChatType === 'group' && groupChatId) {
                              pinGroupChatMessageForUser(groupChatId, m.id, myId, !isPinned).catch(err => console.error('Falha ao alternar pin (grupo)', err));
                            }
                          }}
                          onDeleteForMe={() => {
                            if (!myId) return;
                            if (activeChatType === 'user' && chatId) {
                              hideChatMessageForUser(chatId, m.id, myId, true).catch(err => console.error('Falha ao excluir para mim', err));
                            } else if (activeChatType === 'group' && groupChatId) {
                              hideGroupChatMessageForUser(groupChatId, m.id, myId, true).catch(err => console.error('Falha ao excluir para mim (grupo)', err));
                            }
                          }}
                          onDeleteForAll={() => {
                            if (activeChatType === 'user' && chatId) {
                              deleteChatMessage(chatId, m.id).catch(err => console.error('Falha ao excluir para todos', err));
                            } else if (activeChatType === 'group' && groupChatId) {
                              deleteGroupChatMessage(groupChatId, m.id).catch(err => console.error('Falha ao excluir para todos (grupo)', err));
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {regularMessages.map((m: any) => (
                  <MessageBubble
                    key={m.id}
                    text={m.text}
                    attachments={m.attachments || []}
                    timestamp={m.createdAt?.toDate ? m.createdAt.toDate().getTime() : undefined}
                    isMe={m.senderId === myId}
                    read={true}
                    pinned={!!(m?.pinnedBy?.[myId])}
                    onTogglePin={() => {
                      if (!myId) return;
                      const isPinned = !!m?.pinnedBy?.[myId];
                      if (activeChatType === 'user' && chatId) {
                        pinChatMessageForUser(chatId, m.id, myId, !isPinned).catch(err => console.error('Falha ao alternar pin', err));
                      } else if (activeChatType === 'group' && groupChatId) {
                        pinGroupChatMessageForUser(groupChatId, m.id, myId, !isPinned).catch(err => console.error('Falha ao alternar pin (grupo)', err));
                      }
                    }}
                    onDeleteForMe={() => {
                      if (!myId) return;
                      if (activeChatType === 'user' && chatId) {
                        hideChatMessageForUser(chatId, m.id, myId, true).catch(err => console.error('Falha ao excluir para mim', err));
                      } else if (activeChatType === 'group' && groupChatId) {
                        hideGroupChatMessageForUser(groupChatId, m.id, myId, true).catch(err => console.error('Falha ao excluir para mim (grupo)', err));
                      }
                    }}
                    onDeleteForAll={() => {
                      if (activeChatType === 'user' && chatId) {
                        deleteChatMessage(chatId, m.id).catch(err => console.error('Falha ao excluir para todos', err));
                      } else if (activeChatType === 'group' && groupChatId) {
                        deleteGroupChatMessage(groupChatId, m.id).catch(err => console.error('Falha ao excluir para todos (grupo)', err));
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LiderChatPrototypeApp;