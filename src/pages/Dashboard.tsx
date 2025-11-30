import React, { useEffect, useMemo, useState } from 'react';
import { RRule } from 'rrule';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Bell, Megaphone, Calendar, Filter, Info, Image, MessageCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import AnnouncementCard from '../components/Common/AnnouncementCard';

import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, getCountFromServer } from 'firebase/firestore';


type DashboardTab = 'announcements' | 'chat';

  const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { announcements, deleteAnnouncement, showConfirmation, getOccurrences } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState<'todos' | 'avisos' | 'eventos'>('todos');
  const [activeTab, setActiveTab] = useState<DashboardTab>('announcements');
  const [statusTab, setStatusTab] = useState<'aberto' | 'expirado' | 'rejeitado'>('aberto');
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [rawUnreadChatsCount, setRawUnreadChatsCount] = useState<number>(0);
  const [showChatTabAlert, setShowChatTabAlert] = useState<boolean>(false);
  const [chatTabAlertTimerId, setChatTabAlertTimerId] = useState<number | null>(null);

  // Ajusta a aba ativa via query param (?tab=chat)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'chat') setActiveTab('chat');
    if (tab === 'announcements') setActiveTab('announcements');
  }, [location.search]);

  // Atualização em tempo real para mover itens entre Aberto/Expirado
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Badge de conversas não vistas na aba "Chat" com contagem estável e atraso de 5s
  useEffect(() => {
    if (!user?.id) return;
    const chatsRef = collection(db, 'chats');
    const qChats = query(chatsRef, where('participants', 'array-contains', user.id));
    const unsub = onSnapshot(qChats, async (snap) => {
      const tasks: Promise<boolean>[] = [];
      snap.forEach(d => {
        const data: any = d.data();
        const participants: string[] = data.participants || [];
        const otherId = participants.find(p => p !== user.id);
        const rawLastViewed = data.lastViewed?.[user.id];
        const lastViewedAt = rawLastViewed?.toDate ? rawLastViewed.toDate() : (rawLastViewed instanceof Date ? rawLastViewed : undefined);
        if (!otherId) return;
        tasks.push((async () => {
          try {
            const msgsRef = collection(db, 'chats', d.id, 'messages');
            const qCount = lastViewedAt
              ? query(msgsRef, where('senderId', '==', otherId), where('createdAt', '>', lastViewedAt))
              : query(msgsRef, where('senderId', '==', otherId));
            const agg = await getCountFromServer(qCount);
            const cnt = (agg.data() as any).count || 0;
            return cnt > 0;
          } catch {
            return false;
          }
        })());
      });
      try {
        const results = await Promise.all(tasks);
        const count = results.filter(Boolean).length;
        // Limpa timer anterior
        if (chatTabAlertTimerId) {
          try { clearTimeout(chatTabAlertTimerId); } catch {}
        }
        setRawUnreadChatsCount(count);
        if (count > 0) {
          const id = window.setTimeout(() => {
            setShowChatTabAlert(true);
          }, 5000);
          setChatTabAlertTimerId(id);
        } else {
          setShowChatTabAlert(false);
          setChatTabAlertTimerId(null);
        }
      } catch {
        setRawUnreadChatsCount(0);
        setShowChatTabAlert(false);
      }
    });
    return () => { try { unsub(); } catch {} };
  }, [user?.id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userAnnouncements = announcements.filter(announcement => {
    if (user.role === 'admin') return true;
    return announcement.authorId === user.id;
  }).sort((a, b) => {
    // Tratamento seguro de datas
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
    return bTime - aTime;
  });

  const filteredAnnouncements = userAnnouncements.filter(announcement => {
    if (filter === 'todos') return true;
    if (filter === 'avisos') return announcement.type === 'aviso';
    if (filter === 'eventos') return announcement.type !== 'aviso';
    return true;
  });

  // Divisão por status de ocorrência: Aberto (apenas aprovados com próxima ocorrência >= hoje ou em andamento) e Expirado (apenas aprovados sem próximas ocorrências)
  const { openAnnouncements, expiredAnnouncements, counts } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const hasUpcoming = (a: any) => getOccurrences(a.rruleString, now, nextYear).length > 0;
    const isInProgress = (a: any) => {
      if (!a.endTime) return false;
      const todays = getOccurrences(a.rruleString, startOfToday, endOfToday);
      if (todays.length === 0) return false;
      let startDate = todays[0];
      let hasStartTime = false;
      try {
        const rule = RRule.fromString(a.rruleString);
        const dtstart: Date | undefined = (rule as any).options?.dtstart;
        if (dtstart) {
          const sh = dtstart.getHours();
          const sm = dtstart.getMinutes();
          hasStartTime = (sh + sm) > 0;
          if (hasStartTime) {
            startDate = new Date(startDate);
            startDate.setHours(sh || 0, sm || 0, 0, 0);
          }
        }
      } catch {}
      if (!hasStartTime) return false; // não marcar "Em Andamento" sem horário de início definido
      const [eh, em] = a.endTime.split(':').map(Number);
      const endDate = new Date(startDate);
      endDate.setHours(eh || 0, em || 0, 0, 0);
      return startDate <= now && endDate >= now;
    };
    // Mostrar apenas itens APROVADOS em "Aberto" e "Expirado"
    const approvedOnly = filteredAnnouncements.filter(a => a.status === 'approved');
    const open = approvedOnly.filter(a => hasUpcoming(a) || isInProgress(a));
    const expired = approvedOnly.filter(a => !(hasUpcoming(a) || isInProgress(a)));
    return { 
      openAnnouncements: open, 
      expiredAnnouncements: expired,
      counts: { open: open.length, expired: expired.length }
    };
  }, [filteredAnnouncements, getOccurrences, nowTick]);
  
  // Sistema "Mensagens" removido. Mantemos apenas Programações e Chat.

  const handleDelete = (id: string) => {
    showConfirmation(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta programação? A ação não pode ser desfeita.',
      () => deleteAnnouncement(id)
    );
  };

  const { showToast } = useToast();
  const handleEdit = (announcement: any) => {
    if (announcement?.status === 'rejected') {
      showToast('warning', 'Programações Rejeitadas não poderão ser Restauradas');
      return;
    }
    navigate(`/edit-announcement/${announcement.id}`);
  };

  const TabButton: React.FC<{ tabName: DashboardTab; label: string; icon: React.ReactNode; count?: number }> = ({ tabName, label, icon, count }) => (
    <button
      onClick={() => { setActiveTab(tabName); navigate({ pathname: location.pathname, search: `?tab=${tabName}` }); }}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${
        activeTab === tabName
          ? 'bg-church-primary/10 text-church-primary'
          : 'text-jkd-text hover:bg-jkd-bg-sec'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-auto inline-flex items-center justify-center h-2 w-2 rounded-full bg-red-500 animate-pulse" aria-label={`Novas mensagens: ${count}`}></span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Megaphone className="h-8 w-8 text-church-primary" />
                <h1 className="text-3xl font-bold text-jkd-heading">Painel de Controle</h1>
              </div>
              <p className="text-jkd-text mt-1">Gerencie suas programações e mensagens.</p>
            </div>
            {activeTab === 'announcements' && (
              <div className="flex gap-2">
                <Link to="/new-programacao2" className="inline-flex items-center space-x-2 bg-church-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-church-primary/90 transition-colors shadow-sm hover:shadow-md">
                  <Plus size={20} />
                  <span>Nova Programação</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 rounded-lg p-4 flex items-start gap-3">
              <Info size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Lógica de Limpeza Automática</h4>
                <p className="text-sm">Para manter o sistema organizado, itens não recorrentes são automaticamente apagados 30 dias após sua data de ocorrência.</p>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 text-orange-800 dark:text-orange-300 rounded-lg p-4 flex items-start gap-3">
              <Image size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Limite de Imagem</h4>
                <p className="text-sm">Para garantir o bom desempenho, o tamanho máximo para qualquer imagem é de <strong>5MB</strong>.</p>
              </div>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-1/4">
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4 space-y-2 mb-6">
              <TabButton tabName="announcements" label="Programações" icon={<Calendar size={16} />} />
              <Link to="/chat" className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left text-jkd-text hover:bg-jkd-bg-sec">
                <MessageCircle size={16} />
                <span>Líder-Chat</span>
                {showChatTabAlert && rawUnreadChatsCount > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center h-2 w-2 rounded-full bg-red-500 animate-pulse" aria-label={`Novas mensagens: ${rawUnreadChatsCount}`}></span>
                )}
              </Link>
              <Link to="/galeria" className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left text-jkd-text hover:bg-jkd-bg-sec">
                <Image size={16} />
                <span>Galeria</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-jkd-bg-sec rounded-lg p-4 border border-jkd-border text-center">
                <p className="text-sm font-medium text-jkd-text">Pendentes</p>
                <p className="text-2xl font-bold text-jkd-heading">{userAnnouncements.filter(a => a.status === 'pending').length}</p>
              </div>
              <div className="bg-jkd-bg-sec rounded-lg p-4 border border-jkd-border text-center">
                <p className="text-sm font-medium text-jkd-text">Aprovados</p>
                <p className="text-2xl font-bold text-jkd-heading">{
                  (() => {
                    const now = new Date();
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
                    const hasUpcoming = (a: any) => getOccurrences(a.rruleString, now, nextYear).length > 0;
                    const isInProgress = (a: any) => {
                      if (!a.endTime) return false;
                      const todays = getOccurrences(a.rruleString, startOfToday, endOfToday);
                      if (todays.length === 0) return false;
                      const date = todays[0];
                      const [eh, em] = a.endTime.split(':').map(Number);
                      const endDate = new Date(date);
                      endDate.setHours(eh || 0, em || 0, 0, 0);
                      return date <= now && endDate >= now;
                    };
                    return userAnnouncements.filter(a => a.status === 'approved' && (hasUpcoming(a) || isInProgress(a))).length;
                  })()
                }</p>
              </div>
            </div>
          </aside>

          <main className="lg:w-3/4">
            {activeTab === 'announcements' && (
              <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
                <div className="p-6 border-b border-jkd-border">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <h2 className="text-lg font-semibold text-jkd-heading">Minhas Programações</h2>
                    <div className="flex items-center space-x-2">
                      <Filter className="h-4 w-4 text-jkd-text" />
                      <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="bg-jkd-bg border border-jkd-border rounded-md px-3 py-1 text-sm text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary">
                        <option value="todos">Todos</option>
                        <option value="eventos">Eventos e Outros</option>
                        <option value="avisos">Avisos</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {/* Tabs Aberto / Expirado / Rejeitado */}
                  <div className="flex gap-2 mb-4">
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border ${statusTab === 'aberto' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg border-jkd-border text-jkd-text hover:bg-jkd-bg-sec'}`}
                      onClick={() => setStatusTab('aberto')}
                    >
                      Aberto ({counts.open})
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border ${statusTab === 'expirado' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg border-jkd-border text-jkd-text hover:bg-jkd-bg-sec'}`}
                      onClick={() => setStatusTab('expirado')}
                    >
                      Expirado ({counts.expired})
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border ${statusTab === 'rejeitado' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg border-jkd-border text-jkd-text hover:bg-jkd-bg-sec'}`}
                      onClick={() => setStatusTab('rejeitado' as any)}
                    >
                      Rejeitado ({filteredAnnouncements.filter(a => a.status === 'rejected').length})
                    </button>
                  </div>

                  {statusTab === 'expirado' && (
                    <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg p-4 flex items-start gap-3">
                      <Info size={20} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Aviso sobre Programações Expiradas</h4>
                        <p className="text-sm">Por integridade dos registros, programações expiradas que forem restauradas alterando a data para uma nova data a vencer, serão encaminhadas para nova aprovação na área Administrativa. Para agilizar o processo é recomendado enviar uma mensagem pelo chat ao Administrador alertando sobre programações restauradas.</p>
                      </div>
                    </div>
                  )}

                  {statusTab === 'rejeitado' && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 rounded-lg p-4 flex items-start gap-3">
                      <Info size={20} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold">Aviso sobre Programações Rejeitadas</h4>
                        <p className="text-sm">Programações rejeitadas não podem ser restauradas.</p>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const list = statusTab === 'aberto' ? openAnnouncements : statusTab === 'expirado' ? expiredAnnouncements : filteredAnnouncements.filter(a => a.status === 'rejected');
                    if (list.length > 0) {
                      return (
                        <div className="space-y-6">
                          {list.map(announcement => {
                            // Destaque visual para itens em andamento
                            const now = new Date();
                            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                            const todays = getOccurrences(announcement.rruleString, startOfToday, endOfToday);
                            let inProgress = false;
                            if (announcement.endTime && todays.length > 0) {
                              let startDate = todays[0];
                              let hasStartTime = false;
                              try {
                                const rule = RRule.fromString(announcement.rruleString);
                                const dtstart: Date | undefined = (rule as any).options?.dtstart;
                                if (dtstart) {
                                  const sh = dtstart.getHours();
                                  const sm = dtstart.getMinutes();
                                  hasStartTime = (sh + sm) > 0;
                                  if (hasStartTime) {
                                    startDate = new Date(startDate);
                                    startDate.setHours(sh || 0, sm || 0, 0, 0);
                                  }
                                }
                              } catch {}
                              if (hasStartTime) {
                                const [eh, em] = announcement.endTime.split(':').map(Number);
                                const endDate = new Date(startDate);
                                endDate.setHours(eh || 0, em || 0, 0, 0);
                                inProgress = startDate <= now && endDate >= now;
                              } else {
                                inProgress = false;
                              }
                            }
                            return (
                              <AnnouncementCard key={announcement.id} announcement={announcement} showActions={true} onEdit={handleEdit} onDelete={handleDelete} inProgress={inProgress} />
                            );
                          })}
                        </div>
                      );
                    }
                    return (
                      <div className="text-center py-12"><Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-jkd-text">{statusTab === 'aberto' ? 'Nenhuma programação aberta.' : statusTab === 'expirado' ? 'Nenhuma programação expirada.' : 'Nenhuma programação rejeitada.'}</p></div>
                    );
                  })()}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
