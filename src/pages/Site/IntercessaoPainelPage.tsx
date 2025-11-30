import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { db } from '../../lib/firebase';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import type { PrayerRequest, PrayerStatus } from '../../types';
import { motifLabel } from '../../utils/motifs';
import InputPromptModal from '../../components/Common/InputPromptModal';
// Removido Navigate; proteção é feita pela rota protegida em App.tsx

type StatusFilter = 'todos' | PrayerStatus;

const statusColors: Record<PrayerStatus, string> = {
  approved: 'bg-green-100 text-green-700 border-green-300',
  pending: 'bg-amber-100 text-amber-700 border-amber-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
  archived: 'bg-gray-100 text-gray-700 border-gray-300',
  active: 'bg-blue-100 text-blue-700 border-blue-300'
};

const statusLabel: Record<PrayerStatus, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  rejected: 'Rejeitado',
  archived: 'Arquivado',
  active: 'Ativo'
};

// Gráficos (Recharts)
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const statusPalette: Record<PrayerStatus, string> = {
  approved: '#16a34a',
  pending: '#f59e0b',
  rejected: '#dc2626',
  archived: '#6b7280',
  active: '#2563eb'
};

type SortBy = 'createdAt' | 'name' | 'status' | 'motif' | 'isPrivate';
type SortDir = 'asc' | 'desc';

const IntercessaoPainelPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PrayerRequest[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('todos');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<PrayerRequest | null>(null);
  const [comments, setComments] = useState<Array<{ id: string; prayerId: string; userName: string; text: string; createdAt?: any }>>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'detalhes' | 'pedidos'>('detalhes');
  const [dateFilterType, setDateFilterType] = useState<'none' | 'day' | 'year'>('none');
  const [dateFilterValue, setDateFilterValue] = useState<string>('');
  const [isPwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdModalMessage, setPwdModalMessage] = useState<string>('Informe a senha para abrir o pedido (Painel).');
  const [pendingOpenItem, setPendingOpenItem] = useState<PrayerRequest | null>(null);

  const getCreatedMs = (cr: any) => {
    if (!cr) return 0;
    try {
      if (typeof cr === 'number') return cr;
      if (cr?.seconds) return cr.seconds * 1000;
      if (typeof cr?.toDate === 'function') return cr.toDate().getTime();
      const d = new Date(cr);
      const t = d.getTime();
      return Number.isNaN(t) ? 0 : t;
    } catch { return 0; }
  };

  const formatDateTime = (cr: any) => {
    const t = getCreatedMs(cr);
    if (!t) return '-';
    const d = new Date(t);
    return d.toLocaleString('pt-BR');
  };

  const stats = useMemo(() => {
    const total = items.length;
    const byStatus: Record<PrayerStatus, number> = {
      approved: 0, pending: 0, rejected: 0, archived: 0, active: 0
    };
    const byMotif: Record<string, number> = {};
    const prayersByMotif: Record<string, number> = {};
    const prayersByAffiliation: Record<string, number> = {};
    let totalPrayers = 0;
    const daily: Record<string, number> = {};
    const byPrivacy: { private: number; public: number } = { private: 0, public: 0 };
    items.forEach(it => {
      byStatus[it.status] = (byStatus[it.status] || 0) + 1;
      totalPrayers += (it.prayCount || 0);
      byMotif[it.motif] = (byMotif[it.motif] || 0) + 1;
      prayersByMotif[it.motif] = (prayersByMotif[it.motif] || 0) + (it.prayCount || 0);
      const aff = (it.affiliation || 'nao_informado');
      prayersByAffiliation[aff] = (prayersByAffiliation[aff] || 0) + (it.prayCount || 0);
      if (it.isPrivate) byPrivacy.private++; else byPrivacy.public++;
      const d = it.createdAt ? new Date((it.createdAt as any).seconds ? (it.createdAt as any).seconds * 1000 : it.createdAt) : null;
      if (d) {
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        daily[key] = (daily[key] || 0) + 1;
      }
    });
    return { total, byStatus, byMotif, prayersByMotif, prayersByAffiliation, totalPrayers, daily, byPrivacy };
  }, [items]);

  useEffect(() => { (async () => {
    setLoading(true);
    try {
      const baseCol = collection(db, 'prayers');
      const q = query(baseCol, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: PrayerRequest[] = [] as any;
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
      setItems(list);
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err);
      showToast('error', err?.message || 'Falha ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  })(); }, []);

  useEffect(() => { (async () => {
    setCommentsLoading(true);
    try {
      const base = collection(db, 'prayer_comments');
      const snap = await getDocs(query(base, orderBy('createdAt', 'desc')));
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
      setComments(list);
    } catch (err) {
      console.warn('Falha ao carregar comentários:', err);
    } finally { setCommentsLoading(false); }
  })(); }, []);

  const filtered = useMemo(() => {
    const byStatus = filter === 'todos' ? items : items.filter(i => i.status === filter);
    const bySearch = (() => {
      if (!search) return byStatus;
      const s = search.toLowerCase();
      return byStatus.filter(i =>
        (i.name || '').toLowerCase().includes(s) || (i.text || '').toLowerCase().includes(s) || (i.email || '').toLowerCase().includes(s) || (i.phone || '').toLowerCase().includes(s)
      );
    })();

    const byDate = (() => {
      if (dateFilterType === 'none' || !dateFilterValue) return bySearch;
      return bySearch.filter(i => {
        const t = getCreatedMs(i.createdAt);
        if (!t) return false;
        const d = new Date(t);
        const yyyy = String(d.getFullYear());
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        if (dateFilterType === 'day') {
          const key = `${yyyy}-${mm}-${dd}`;
          return key === dateFilterValue;
        }
        if (dateFilterType === 'year') {
          return yyyy === dateFilterValue;
        }
        return true;
      });
    })();

    return byDate;
  }, [items, filter, search, dateFilterType, dateFilterValue]);

  const sorted = useMemo(() => {
    const getDate = (cr: any) => {
      if (!cr) return 0;
      if (cr.seconds) return cr.seconds * 1000;
      if (typeof cr === 'number') return cr;
      const d = new Date(cr);
      return d.getTime();
    };
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any, bv: any;
      if (sortBy === 'createdAt') { av = getDate(a.createdAt); bv = getDate(b.createdAt); }
      else if (sortBy === 'name') { av = (a.name || '').toLowerCase(); bv = (b.name || '').toLowerCase(); }
      else if (sortBy === 'status') { av = a.status; bv = b.status; }
      else if (sortBy === 'motif') { av = (a.motif || '').toLowerCase(); bv = (b.motif || '').toLowerCase(); }
      else if (sortBy === 'isPrivate') { av = !!a.isPrivate; bv = !!b.isPrivate; }
      else { av = 0; bv = 0; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, totalPages - 1);
  const paginated = useMemo(() => {
    const start = pageSafe * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSafe, pageSize]);

  useEffect(() => { setPage(0); }, [filter, search, sortBy, sortDir, pageSize, dateFilterType, dateFilterValue]);

  const commentStats = useMemo(() => {
    const total = comments.length;
    const byPrayer: Record<string, number> = {};
    const daily: Record<string, number> = {};
    comments.forEach(c => {
      byPrayer[c.prayerId] = (byPrayer[c.prayerId] || 0) + 1;
      const v: any = c.createdAt;
      let t = 0;
      try { if (!v) t=0; else if (v.seconds) t=v.seconds*1000; else if (v instanceof Date) t=v.getTime(); else t=new Date(v).getTime(); } catch { t=0; }
      if (t) {
        const d = new Date(t);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        daily[key] = (daily[key] || 0) + 1;
      }
    });
    const byPrayerNamed = Object.entries(byPrayer).map(([pid, count]) => {
      const pr = items.find(i => i.id === pid);
      const name = pr ? (pr.isPrivate ? 'Reservado' : (pr.name || 'Sem nome')).slice(0,16) : 'Pedido';
      return { name, count };
    });
    return { total, byPrayerNamed, daily };
  }, [comments, items]);

  const setStatus = async (id: string, status: PrayerStatus) => {
    try {
      await updateDoc(doc(db, 'prayers', id), { status });
      setItems(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      showToast('success', `Status atualizado para ${status}.`);
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      let msg = 'Erro ao atualizar status.';
      if (err?.code === 'permission-denied') msg = 'Permissão negada. Faça login como administrador.';
      if (err?.code === 'unauthenticated') msg = 'Sessão expirada. Faça login novamente.';
      showToast('error', msg);
    }
  };

  const remove = async (id: string) => {
    try {
      // Excluir comentários vinculados antes de remover o pedido
      try {
        const snap = await getDocs(query(collection(db, 'prayer_comments'), where('prayerId', '==', id)));
        const ops: Promise<any>[] = [];
        snap.forEach(d => ops.push(deleteDoc(doc(db, 'prayer_comments', d.id))));
        if (ops.length) await Promise.all(ops);
      } catch (e) {
        console.warn('Aviso: falha ao excluir comentários do pedido', id, e);
      }
      await deleteDoc(doc(db, 'prayers', id));
      setItems(prev => prev.filter(p => p.id !== id));
      showToast('success', 'Pedido deletado.');
    } catch (err: any) {
      console.error('Erro ao deletar pedido:', err);
      let msg = 'Erro ao deletar pedido.';
      if (err?.code === 'permission-denied') msg = 'Permissão negada. Faça login como administrador.';
      if (err?.code === 'unauthenticated') msg = 'Sessão expirada. Faça login novamente.';
      showToast('error', msg);
    }
  };

  // Não redirecionar aqui; a proteção é tratada por ProtectedRoute em App.tsx

  const openItemWithPassword = (it: PrayerRequest) => {
    setPendingOpenItem(it);
    setPwdModalMessage('Informe a senha para abrir o pedido (Painel).');
    setPwdModalOpen(true);
  };

  const handleConfirmPwdPanel = (pwd: string) => {
    if (pwd === '#PrEduardo*' && pendingOpenItem) {
      setSelected(pendingOpenItem);
      setPendingOpenItem(null);
      setPwdModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-jkd-heading">Painel de Pedidos</h1>
            <p className="text-jkd-text">Visualize detalhes completos e gerencie os pedidos.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/site/pedido-de-oracao')}
            className="px-3 py-2 rounded-md border border-jkd-border text-jkd-heading hover:bg-jkd-bg"
          >
            Voltar
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('detalhes')}
            className={`px-3 py-2 rounded-md border ${activeTab === 'detalhes' ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border hover:bg-jkd-border/30 text-jkd-text'}`}
          >
            Detalhes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pedidos')}
            className={`px-3 py-2 rounded-md border ${activeTab === 'pedidos' ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border hover:bg-jkd-border/30 text-jkd-text'}`}
          >
            Pedidos
          </button>
        </div>

        {/* Estatísticas avançadas (Detalhes) */}
        {activeTab === 'detalhes' && (
          <>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4">
                <h2 className="text-lg font-semibold text-jkd-heading">Resumo</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded border bg-gray-50">
                    <div className="text-jkd-text">Total</div>
                    <div className="text-xl font-bold">{stats.total}</div>
                  </div>
                  <div className="p-2 rounded border bg-green-50">
                    <div className="text-green-700">Aprovados</div>
                    <div className="text-xl font-bold">{stats.byStatus.approved}</div>
                  </div>
                  <div className="p-2 rounded border bg-amber-50">
                    <div className="text-amber-700">Pendentes</div>
                    <div className="text-xl font-bold">{stats.byStatus.pending}</div>
                  </div>
                  <div className="p-2 rounded border bg-red-50">
                    <div className="text-red-700">Rejeitados</div>
                    <div className="text-xl font-bold">{stats.byStatus.rejected}</div>
                  </div>
                  <div className="p-2 rounded border bg-blue-50">
                    <div className="text-blue-700">Ativos</div>
                    <div className="text-xl font-bold">{stats.byStatus.active}</div>
                  </div>
                  <div className="p-2 rounded border bg-gray-50">
                    <div className="text-jkd-text">Total de orações</div>
                    <div className="text-xl font-bold">{stats.totalPrayers}</div>
                  </div>
                </div>
              </div>

              <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4 lg:col-span-2">
                <h2 className="text-lg font-semibold text-jkd-heading">Distribuição por Status</h2>
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={Object.entries(stats.byStatus).map(([status, value]) => ({ status, name: statusLabel[status as PrayerStatus], value }))}
                        nameKey="name"
                        outerRadius={80}
                        label
                      >
                        {Object.entries(stats.byStatus).map(([status]) => (
                          <Cell key={status} fill={statusPalette[status as PrayerStatus]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pedidos por dia (30 dias) */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4 lg:col-span-2">
                <h2 className="text-lg font-semibold text-jkd-heading">Pedidos por dia (30 dias)</h2>
                <div className="mt-3 h-64 w-full">
                  <ResponsiveContainer>
                    <BarChart data={Object.entries(stats.daily).slice(-30).map(([day, count]) => ({ day, count }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Pedidos" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Termômetro de Orações */}
            <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-4">
              <h2 className="text-lg font-semibold text-jkd-heading">Termômetro de Orações</h2>
              <p className="text-sm text-jkd-text">Acompanhe intensidade de oração por pedidos, motivos e vínculos.</p>
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top pedidos por orações */}
                <div>
                  <h3 className="text-sm font-semibold text-jkd-heading">Pedidos mais orados</h3>
                  <div className="mt-2 h-64 w-full">
                    <ResponsiveContainer>
                      <BarChart data={[...items].sort((a,b)=> (b.prayCount||0)-(a.prayCount||0)).slice(0,6).map(it => ({ name: (it.isPrivate ? 'Reservado' : (it.name||'Sem nome')).slice(0,16), count: it.prayCount || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Orações" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Motivos mais orados */}
                <div>
                  <h3 className="text-sm font-semibold text-jkd-heading">Motivos mais orados</h3>
                  <div className="mt-2 h-64 w-full">
                    <ResponsiveContainer>
                      <BarChart data={Object.entries(stats.prayersByMotif).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([motif, count]) => ({ name: motifLabel(motif), count }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Orações" fill="#22c55e" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                {/* Vínculos orando */}
                <div>
                  <h3 className="text-sm font-semibold text-jkd-heading">Vínculos orando</h3>
                  <div className="mt-2 h-64 w-full">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie dataKey="value" nameKey="name" data={Object.entries(stats.prayersByAffiliation).map(([aff, value]) => ({ name: aff === 'membro' ? 'Membros' : aff === 'visitante' ? 'Visitantes' : aff === 'outro' ? 'Outros' : 'Não informado', value }))} outerRadius={80} label>
                          {Object.keys(stats.prayersByAffiliation).map((aff, idx) => (
                            <Cell key={aff+idx} fill={aff === 'membro' ? '#3b82f6' : aff === 'visitante' ? '#f59e0b' : aff === 'outro' ? '#6366f1' : '#9ca3af'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Comentários: análises modernas */}
            <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-4">
              <h2 className="text-lg font-semibold text-jkd-heading">Comentários</h2>
              <p className="text-sm text-jkd-text">Total, distribuição por pedido e atividade diária.</p>
              {commentsLoading ? (
                <p className="text-jkd-text">Carregando comentários...</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-jkd-heading">Resumo</h3>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      <div className="bg-jkd-bg rounded border border-jkd-border p-3 text-center">
                        <p className="text-xs text-jkd-text">Total</p>
                        <p className="text-xl font-bold text-jkd-heading">{commentStats.total}</p>
                      </div>
                      <div className="bg-jkd-bg rounded border border-jkd-border p-3 text-center">
                        <p className="text-xs text-jkd-text">Pedidos únicos</p>
                        <p className="text-xl font-bold text-jkd-heading">{commentStats.byPrayerNamed.length}</p>
                      </div>
                      <div className="bg-jkd-bg rounded border border-jkd-border p-3 text-center">
                        <p className="text-xs text-jkd-text">Média por pedido</p>
                        <p className="text-xl font-bold text-jkd-heading">{commentStats.byPrayerNamed.length ? Math.round((commentStats.total / commentStats.byPrayerNamed.length) * 10)/10 : 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <h3 className="text-sm font-semibold text-jkd-heading">Top pedidos por comentários</h3>
                    <div className="mt-2 h-64 w-full">
                      <ResponsiveContainer>
                        <BarChart data={[...commentStats.byPrayerNamed].sort((a,b)=> b.count-a.count).slice(0,8)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Comentários" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="lg:col-span-3">
                    <h3 className="text-sm font-semibold text-jkd-heading">Comentários por dia</h3>
                    <div className="mt-2 h-64 w-full">
                      <ResponsiveContainer>
                        <BarChart data={Object.entries(commentStats.daily).sort((a,b)=> a[0].localeCompare(b[0])).map(([k,v])=>({ day:k, count:v }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Comentários" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Distribuição por Privacidade */}
            <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-4">
              <h2 className="text-lg font-semibold text-jkd-heading">Distribuição por Privacidade</h2>
              <div className="mt-3 h-64 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie dataKey="value" nameKey="name" data={[{ name: 'Privados', value: stats.byPrivacy.private }, { name: 'Públicos', value: stats.byPrivacy.public }]} outerRadius={80} label>
                      <Cell fill="#6b7280" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Filtros e Pedidos (Cards) */}
        {activeTab === 'pedidos' && (
          <>
            {/* Filtros */}
            <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-4 flex flex-wrap items-center gap-3">
              <select value={filter} onChange={e=>setFilter(e.target.value as StatusFilter)} className="px-3 py-2 rounded border border-jkd-border bg-jkd-bg text-jkd-text">
                <option value="todos">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
                <option value="archived">Arquivados</option>
                <option value="active">Ativos</option>
              </select>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, texto, email, telefone" className="flex-1 min-w-[220px] px-3 py-2 rounded border border-jkd-border bg-jkd-bg text-jkd-text" />
              <select value={dateFilterType} onChange={e=>{ setDateFilterType(e.target.value as any); setDateFilterValue(''); }} className="px-3 py-2 rounded border border-jkd-border bg-jkd-bg text-jkd-text">
                <option value="none">S/ filtro de data</option>
                <option value="day">Por dia</option>
                <option value="year">Por ano</option>
              </select>
              {dateFilterType === 'day' && (
                <input type="date" value={dateFilterValue} onChange={e=>setDateFilterValue(e.target.value)} className="px-3 py-2 rounded border border-jkd-border bg-jkd-bg text-jkd-text" />
              )}
              {dateFilterType === 'year' && (
                <input type="number" min={1990} max={2100} value={dateFilterValue} onChange={e=>setDateFilterValue(e.target.value)} placeholder="AAAA" className="w-[100px] px-3 py-2 rounded border border-jkd-border bg-jkd-bg text-jkd-text" />
              )}
            </div>

            {/* Cards de pedidos com pop-up detalhado */}
            <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-4">
              {loading ? (
                <p className="text-jkd-text">Carregando...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginated.map(it => (
                      <button
                        key={it.id}
                        className="text-left bg-jkd-bg border border-jkd-border rounded-lg p-4 hover:border-church-primary/60 focus:outline-none focus:ring-2 focus:ring-church-primary/40"
                        onClick={() => {
                          if (it.isPrivate) {
                            openItemWithPassword(it);
                          } else {
                            setSelected(it);
                          }
                        }}
                        aria-label={`Abrir detalhes do pedido de ${it.name}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-jkd-heading">{it.isPrivate ? '***********' : (it.hideName ? 'Reservado' : (it.name || 'Sem nome'))}</span>
                          <span className={`inline-block px-2 py-1 rounded border text-xs ${statusColors[it.status]}`}>{statusLabel[it.status]}</span>
                        </div>
                        <div className="mt-1 text-xs text-jkd-text">{formatDateTime(it.createdAt)}</div>
                        <div className="mt-2">
                          <span className="inline-block px-2 py-0.5 rounded bg-church-primary/10 text-church-primary text-xs">{motifLabel(it.motif || 'Outros')}</span>
                          <span className={`ml-2 inline-block px-2 py-0.5 rounded border text-xs ${it.isPrivate ? 'bg-gray-100 text-gray-700 border-gray-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>{it.isPrivate ? 'Privado' : 'Público'}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Paginação */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <button className="px-2 py-1 rounded border border-jkd-border" disabled={pageSafe<=0} onClick={()=>setPage(Math.max(0, pageSafe-1))}>Anterior</button>
                      <button className="px-2 py-1 rounded border border-jkd-border" disabled={pageSafe>=totalPages-1} onClick={()=>setPage(Math.min(totalPages-1, pageSafe+1))}>Próxima</button>
                      <span className="text-jkd-text">Página {pageSafe+1} de {totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-jkd-text">Itens por página</span>
                      <select value={pageSize} onChange={e=>setPageSize(Number(e.target.value))} className="px-2 py-1 rounded border border-jkd-border bg-jkd-bg text-jkd-text">
                        {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Modal de detalhes e ações */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
            <div className="relative bg-jkd-bg-sec border border-jkd-border rounded-lg w-full max-w-2xl max-h-[85vh] overflow-auto">
              <div className="flex items-center justify-between p-3 border-b border-jkd-border">
                <h3 className="text-lg font-semibold text-jkd-heading">Detalhes do Pedido</h3>
                <button className="p-2 rounded hover:bg-jkd-border" onClick={() => setSelected(null)} aria-label="Fechar">✕</button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-jkd-text">Nome</div>
                    <div className="font-medium text-jkd-heading">{selected.isPrivate ? (selected.name || 'Sem nome') : (selected.hideName ? 'Reservado' : (selected.name || 'Sem nome'))}</div>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded border text-xs ${statusColors[selected.status]}`}>{statusLabel[selected.status]}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-jkd-text">Contato</div>
                    <div className="text-jkd-heading">{[selected.email, selected.phone].filter(Boolean).join(' / ') || '-'}</div>
                  </div>
                  <div>
                    <div className="text-jkd-text">Data</div>
                    <div className="text-jkd-heading">{selected.createdAt ? (() => { const d = new Date((selected.createdAt as any).seconds ? (selected.createdAt as any).seconds * 1000 : selected.createdAt); return d.toLocaleString('pt-BR'); })() : '-'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-jkd-text">Motivo</div>
                    <div className="text-jkd-heading">{motifLabel(selected.motif || 'Outros')}</div>
                  </div>
                  <div>
                    <div className="text-jkd-text">Privado</div>
                    <div className="text-jkd-heading">{selected.isPrivate ? 'Sim' : 'Não'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-jkd-text">Pedido</div>
                  <div className="text-jkd-heading whitespace-pre-wrap">{selected.text}</div>
                </div>
                <div>
                  <div className="text-jkd-text">Imagem</div>
                  <div>
                    {selected.imageUrl ? (
                      <a href={selected.imageUrl} target="_blank" rel="noreferrer" className="text-church-primary">Abrir imagem</a>
                    ) : (
                      <span className="text-jkd-heading">-</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-jkd-border">
                  <div className="text-jkd-text mb-2">Ações</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={()=>selected && setStatus(selected.id, 'approved')} className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700">Aprovar</button>
                    <button onClick={()=>selected && setStatus(selected.id, 'pending')} className="px-3 py-1.5 rounded bg-amber-500 text-white hover:bg-amber-600">Pendente</button>
                    <button onClick={()=>selected && setStatus(selected.id, 'rejected')} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">Rejeitar</button>
                    <button onClick={()=>selected && setStatus(selected.id, 'archived')} className="px-3 py-1.5 rounded bg-gray-600 text-white hover:bg-gray-700">Arquivar</button>
                    <button onClick={()=>{ if (selected) { remove(selected.id); setSelected(null); } }} className="px-3 py-1.5 rounded bg-gray-300 text-jkd-heading hover:bg-gray-400">Deletar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Modal de senha para abrir card */}
        <InputPromptModal
          isOpen={isPwdModalOpen}
          title="Acesso Restrito"
          message={pwdModalMessage}
          inputLabel="Senha"
          onConfirm={handleConfirmPwdPanel}
          onCancel={() => { setPwdModalOpen(false); setPendingOpenItem(null); }}
        />
      </div>
    </div>
  );
};

export default IntercessaoPainelPage;