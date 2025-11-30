import React, { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Users, Activity, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
// Removido trackDailyVisit aqui para evitar contagem indevida ao abrir a aba
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

type RoleKey = 'admin' | 'editor' | 'leader' | 'reader' | 'anonymous';

type VisitorDaily = {
  dateId: string; // YYYY-MM-DD
  total: number;
  roles: Record<RoleKey, number>;
};

const StatCard: React.FC<{ title: string; value: number; icon?: React.ReactNode }> = ({ title, value, icon }) => {
  return (
    <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4 flex items-center gap-3">
      <div className="text-church-primary">{icon}</div>
      <div>
        <div className="text-sm text-jkd-text">{title}</div>
        <div className="text-2xl font-bold text-jkd-heading">{value}</div>
      </div>
    </div>
  );
};

const UserAnalyticsTab: React.FC = () => {
  const { authorizedUsers, onlineUserIds } = useApp();
  const [records, setRecords] = useState<Record<string, VisitorDaily>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [anonOnlineCount, setAnonOnlineCount] = useState<number>(0);
  const [readersOnlineCount, setReadersOnlineCount] = useState<number>(0);

  // Não rastrear visita aqui para evitar duplicação diária quando o admin abre esta aba

  // Assinar visitorDaily para estatísticas
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'visitorDaily'), (snap) => {
      const next: Record<string, VisitorDaily> = {};
      snap.forEach((d) => {
        const data: any = d.data();
        const dateId = (data?.dateId || d.id) as string;
        const roles = {
          admin: (data?.roles?.admin || 0) as number,
          editor: (data?.roles?.editor || 0) as number,
          leader: (data?.roles?.leader || 0) as number,
          reader: (data?.roles?.reader || 0) as number,
          anonymous: (data?.roles?.anonymous || 0) as number,
        } as Record<RoleKey, number>;
        next[dateId] = {
          dateId,
          total: (data?.total || 0) as number,
          roles,
        };
      });
      setRecords(next);
    });
    return () => unsub();
  }, []);

  // Assinar coleção de presença anônima e calcular contagem única por visitante com lastSeen recente
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'anonOnlineUsers'), (snap) => {
      const now = Date.now();
      const lastSeenByVisitor = new Map<string, number>();
      snap.forEach((docSnap) => {
        const data: any = docSnap.data();
        const visitorId: string | undefined = data?.visitorId;
        if (!visitorId) return;
        const ts = data?.lastSeen;
        let lastSeen = 0;
        if (ts && typeof ts.toMillis === 'function') {
          try { lastSeen = ts.toMillis(); } catch { lastSeen = data?.timestamp || 0; }
        } else {
          lastSeen = data?.timestamp || 0;
        }
        const prev = lastSeenByVisitor.get(visitorId);
        if (!prev || lastSeen > prev) {
          lastSeenByVisitor.set(visitorId, lastSeen);
        }
      });
      const count = Array.from(lastSeenByVisitor.values()).filter((ls) => now - ls <= 2 * 60 * 1000).length;
      setAnonOnlineCount(count);
    });
    return () => unsub();
  }, []);

  // Assinar presença de leitores autenticados (firebaseUser sem AuthorizedUser)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'readerOnlineUsers'), (snap) => {
      const now = Date.now();
      const lastSeenByUid = new Map<string, number>();
      snap.forEach((docSnap) => {
        const data: any = docSnap.data();
        const uid: string | undefined = data?.uid;
        if (!uid) return;
        const ts = data?.lastSeen;
        let lastSeen = 0;
        if (ts && typeof ts.toMillis === 'function') {
          try { lastSeen = ts.toMillis(); } catch { lastSeen = data?.timestamp || 0; }
        } else {
          lastSeen = data?.timestamp || 0;
        }
        const prev = lastSeenByUid.get(uid);
        if (!prev || lastSeen > prev) {
          lastSeenByUid.set(uid, lastSeen);
        }
      });
      const count = Array.from(lastSeenByUid.values()).filter((ls) => now - ls <= 2 * 60 * 1000).length;
      setReadersOnlineCount(count);
    });
    return () => unsub();
  }, []);

  const todayId = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const today = records[todayId];

  const selectedId = useMemo(() => {
    const d = selectedDate;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [selectedDate]);

  const selectedStats = records[selectedId];

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const id = `${yyyy}-${mm}-${dd}`;
    const total = records[id]?.total || 0;
    if (!total) return null;
    return (
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] px-1 rounded bg-church-primary text-white">
        {total}
      </div>
    );
  };

  const adminsOnline = useMemo(() => authorizedUsers.filter(u => u.role === 'admin' && onlineUserIds.includes(u.id)).length, [authorizedUsers, onlineUserIds]);
  const editorsOnline = useMemo(() => authorizedUsers.filter(u => u.role === 'editor' && onlineUserIds.includes(u.id)).length, [authorizedUsers, onlineUserIds]);
  const leadersOnline = useMemo(() => authorizedUsers.filter(u => u.role === 'leader' && onlineUserIds.includes(u.id)).length, [authorizedUsers, onlineUserIds]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-2">
        <Users className="h-6 w-6 text-church-primary" />
        <h2 className="text-xl font-semibold text-jkd-heading">Usuários</h2>
      </div>
      <p className="text-jkd-text">Acompanhe usuários online em tempo real e visitantes por dia.</p>

      {/* Online (tempo real) - cartões por tipo de usuário */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Admins online" value={adminsOnline} icon={<Activity size={20} />} />
        <StatCard title="Editores online" value={editorsOnline} icon={<Activity size={20} />} />
        <StatCard title="Líderes online" value={leadersOnline} icon={<Activity size={20} />} />
        <StatCard title="Leitores online" value={readersOnlineCount} icon={<Activity size={20} />} />
        <StatCard title="Anônimos online" value={anonOnlineCount} icon={<Activity size={20} />} />
      </div>

      {/* Calendário de visitantes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
            <Calendar
              onChange={(value) => setSelectedDate(value as Date)}
              value={selectedDate}
              locale="pt-BR"
              tileContent={tileContent}
              className="w-full"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
            <h3 className="text-lg font-semibold text-jkd-heading mb-4">Resumo do dia {selectedId}</h3>
            {selectedStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Total" value={selectedStats.total} />
                <StatCard title="Administradores" value={selectedStats.roles.admin || 0} />
                <StatCard title="Editores" value={selectedStats.roles.editor || 0} />
                <StatCard title="Líderes" value={selectedStats.roles.leader || 0} />
                <StatCard title="Leitores" value={selectedStats.roles.reader || 0} />
                <StatCard title="Anônimos" value={selectedStats.roles.anonymous || 0} />
              </div>
            ) : (
              <p className="text-jkd-text">Sem dados para este dia.</p>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos avançados */}
      {Object.keys(records).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
            <h3 className="text-lg font-semibold text-jkd-heading mb-4">Visitantes por dia (últimos 30)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={(() => {
                    const ids = Object.keys(records).sort();
                    const last30 = ids.slice(-30);
                    return last30.map((id) => ({
                      date: id.slice(5),
                      total: records[id].total,
                    }));
                  })()}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#cbd5e1' }} />
                  <YAxis tick={{ fill: '#cbd5e1' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b1220', borderColor: '#1f2937' }} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={2} dot={false} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
            <h3 className="text-lg font-semibold text-jkd-heading mb-4">Distribuição por papel (últimos 14)</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={(() => {
                    const ids = Object.keys(records).sort();
                    const last14 = ids.slice(-14);
                    return last14.map((id) => ({
                      date: id.slice(5),
                      admin: records[id].roles.admin || 0,
                      editor: records[id].roles.editor || 0,
                      leader: records[id].roles.leader || 0,
                      reader: records[id].roles.reader || 0,
                      anonymous: records[id].roles.anonymous || 0,
                    }));
                  })()}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#cbd5e1' }} />
                  <YAxis tick={{ fill: '#cbd5e1' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b1220', borderColor: '#1f2937' }} />
                  <Legend />
                  <Bar dataKey="admin" stackId="roles" fill="#ef4444" name="Admins" />
                  <Bar dataKey="editor" stackId="roles" fill="#f59e0b" name="Editores" />
                  <Bar dataKey="leader" stackId="roles" fill="#10b981" name="Líderes" />
                  <Bar dataKey="reader" stackId="roles" fill="#3b82f6" name="Leitores" />
                  <Bar dataKey="anonymous" stackId="roles" fill="#6366f1" name="Anônimos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAnalyticsTab;