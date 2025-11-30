import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { useApp } from '../../hooks/useApp';
// Removido Navigate; proteção é feita pela rota protegida em App.tsx
import { db, storage } from '../../lib/firebase';
import { collection, doc, getDocs, getDoc, query, setDoc, where, deleteDoc } from 'firebase/firestore';
import { PrayerSettings } from '../../types';
import { Upload, BarChart3, FileDown, AlertTriangle, Trash2 } from 'lucide-react';
import { MOTIF_OPTIONS, motifLabel, motifValues } from '../../utils/motifs';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

type Props = { embed?: boolean };
const IntercessaoAdminPage: React.FC<Props> = ({ embed = false }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showConfirmation } = useApp();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<PrayerSettings>({
    prayersPerPage: 6,
    hideArchivedOnWall: true,
    allowUnpray: false,
    heartIconFilledUrl: '',
    heartIconOutlineUrl: '',
    notificationEmails: [],
    bgImageSource: 'plugin',
    bgImageUrl: '',
    bgImageUploadUrl: '',
    bgRepeat: false,
    bgSize: 'cover',
    bgPosition: 'center',
    bgOpacity: 0.35,
  });
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, totalPrayers: 0 });
  const [exportStatus, setExportStatus] = useState<'todos' | 'approved' | 'pending' | 'rejected'>('todos');
  const [bulkStatus, setBulkStatus] = useState<'todos' | 'approved' | 'pending' | 'rejected' | 'archived'>('todos');
  const [bulkBeforeDate, setBulkBeforeDate] = useState<string>('');
  const [motifs, setMotifs] = useState<string[]>(motifValues());

  useEffect(() => { (async () => {
    try {
      const snap = await getDoc(doc(db, 'prayer_settings', 'default'));
      if (snap.exists()) setForm(snap.data() as PrayerSettings);
      // Estatísticas
      const prayersSnap = await getDocs(collection(db, 'prayers'));
      let total = 0, approved = 0, pending = 0, rejected = 0, totalPrayers = 0;
      const mset = new Set<string>(motifValues());
      prayersSnap.forEach(d => {
        const data: any = d.data();
        total += 1;
        totalPrayers += (data.prayCount || 0);
        const st = data.status;
        if (st === 'approved' || st === 'active') approved += 1;
        else if (st === 'pending') pending += 1;
        else if (st === 'rejected') rejected += 1;
        if (data.motif) mset.add(data.motif);
      });
      setStats({ total, approved, pending, rejected, totalPrayers });
      setMotifs(Array.from(mset));
    } finally { setLoading(false); }
  })(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as any;
    (type === 'checkbox') ? setForm(prev => ({ ...prev, [name]: checked })) : setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleEmails = (v: string) => setForm(prev => ({ ...prev, notificationEmails: v.split(',').map(s => s.trim()).filter(Boolean) }));

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sRef = storageRef(storage, `images/prayers/background/${Date.now()}_${file.name}`);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    setForm(prev => ({ ...prev, bgImageSource: 'upload', bgImageUploadUrl: url }));
  };

  const save = async () => {
    await setDoc(doc(db, 'prayer_settings', 'default'), form, { merge: true });
    showToast('success', 'Configurações salvas com sucesso.');
  };

  const exportCsv = async () => {
    const baseCol = collection(db, 'prayers');
    let q = baseCol as any;
    if (exportStatus !== 'todos') {
      const map: Record<string, string> = { approved: 'approved', pending: 'pending', rejected: 'rejected' };
      q = query(baseCol, where('status', '==', map[exportStatus]));
    }
    const snap = await getDocs(q);
    const rows: string[] = [];
    rows.push(['ID','Status','Nome','Reservado','Motivo','Texto','E-mail','Telefone','Cidade','Estado','Contagem Orações','Criado Em'].join(','));
    snap.forEach(d => {
      const it: any = d.data();
      const created = it.createdAt && it.createdAt.toDate ? it.createdAt.toDate().toISOString() : '';
      const city = it.address?.city || '';
      const state = it.address?.state || '';
      const row = [
        d.id,
        (it.status || ''),
        (it.name || ''),
        (it.isPrivate ? 'Sim' : 'Não'),
        (it.motif || ''),
        JSON.stringify(it.text || ''),
        (it.email || ''),
        (it.phone || ''),
        city,
        state,
        String(it.prayCount || 0),
        created
      ].join(',');
      rows.push(row);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_oracao_${exportStatus}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const bulkDelete = async () => {
    const confirmMsg = 'Atenção: esta ação é destrutiva e não pode ser desfeita. Faça backup do banco antes de prosseguir.';
    showConfirmation('Confirmar exclusão em massa', confirmMsg, async () => {
      const baseCol = collection(db, 'prayers');
      let q = baseCol as any;
      if (bulkStatus !== 'todos') {
        const map: Record<string, string> = { approved: 'approved', pending: 'pending', rejected: 'rejected', archived: 'archived' };
        q = query(baseCol, where('status', '==', map[bulkStatus]));
      }
      const snap = await getDocs(q);
      const before = bulkBeforeDate ? new Date(bulkBeforeDate) : null;
      let count = 0;
      for (const d of snap.docs) {
        const data: any = d.data();
        const created = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : null;
        if (before && created && created >= before) continue;
        // Excluir comentários vinculados
        try {
          const csnap = await getDocs(query(collection(db, 'prayer_comments'), where('prayerId', '==', d.id)));
          const ops: Promise<any>[] = [];
          csnap.forEach(cd => ops.push(deleteDoc(doc(db, 'prayer_comments', cd.id))));
          if (ops.length) await Promise.all(ops);
        } catch (e) {
          console.warn('Aviso: falha ao excluir comentários do pedido', d.id, e);
        }
        await deleteDoc(doc(db, 'prayers', d.id));
        count += 1;
      }
      showToast('success', `Exclusão concluída. Registros removidos: ${count}`);
    });
  };

  // Não redirecionar aqui; a proteção é tratada por ProtectedRoute em App.tsx

  const Content = (
    <div className="mt-6 bg-jkd-bg-sec border border-jkd-border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col text-jkd-text">
                <span className="text-sm">Pedidos por página</span>
                <input type="number" name="prayersPerPage" value={form.prayersPerPage} onChange={handleChange} className="input input-bordered" />
              </label>
              <label className="flex flex-col text-jkd-text">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="hideArchivedOnWall" checked={form.hideArchivedOnWall} onChange={handleChange} /> Ocultar arquivados no mural
                </div>
                <span className="text-xs text-jkd-text mt-1">Quando ativado, pedidos arquivados não aparecem no mural público.</span>
              </label>
              <label className="flex flex-col text-jkd-text">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="allowUnpray" checked={form.allowUnpray} onChange={handleChange} /> Permitir "desorar"
                </div>
                <span className="text-xs text-jkd-text mt-1">Permite desfazer o “Orando”, removendo o coração do usuário.</span>
              </label>
              <label className="flex flex-col text-jkd-text">
                <span className="text-sm">Ícone coração preenchido (URL)</span>
                <input type="text" name="heartIconFilledUrl" value={form.heartIconFilledUrl || ''} onChange={handleChange} className="input input-bordered" />
              </label>
              <label className="flex flex-col text-jkd-text">
                <span className="text-sm">Ícone coração contorno (URL)</span>
                <input type="text" name="heartIconOutlineUrl" value={form.heartIconOutlineUrl || ''} onChange={handleChange} className="input input-bordered" />
              </label>
            </div>

            <label className="flex flex-col text-jkd-text">
              <span className="text-sm">E-mails para notificação (separados por vírgula)</span>
              <input type="text" value={form.notificationEmails.join(', ')} onChange={(e) => handleEmails(e.target.value)} className="input input-bordered" />
            </label>

            {/* Cores dos Motivos */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading">Cores dos Motivos</h2>
              <p className="text-xs text-jkd-text">Defina a cor de fundo exibida no badge do motivo nos cards do mural. Deixe em branco para usar a cor padrão do tema.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {motifs.map((m) => {
                  const val = (form.motifColors || {})[m] || '';
                  return (
                    <div key={m} className="flex items-center justify-between gap-3 border border-jkd-border rounded p-2 bg-jkd-bg">
                      <span className="text-sm text-jkd-text">{motifLabel(m)}</span>
                      <div className="flex items-center gap-2">
                        <input type="color" value={val || '#ffffff'} onChange={(e)=>{
                          const color = e.target.value;
                          setForm(prev => ({ ...prev, motifColors: { ...(prev.motifColors||{}), [m]: color } }));
                        }} />
                        <button type="button" className="btn btn-sm" onClick={()=>{
                          setForm(prev => { const next = { ...(prev.motifColors||{}) }; delete next[m]; return { ...prev, motifColors: next }; });
                        }}>Limpar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plano de Fundo */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading flex items-center gap-2"><Upload size={16}/> Plano de Fundo do Mural</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Fonte da Imagem</span>
                  <select name="bgImageSource" value={form.bgImageSource || 'plugin'} onChange={handleChange} className="input input-bordered">
                    <option value="plugin">Plugin (padrão)</option>
                    <option value="url">URL</option>
                    <option value="upload">Upload</option>
                  </select>
                </label>
                {form.bgImageSource === 'plugin' && (
                  <p className="text-xs text-jkd-text sm:col-span-2">Usando imagem do plugin em <code>/mural-de-oracao/assets/images/placeholders/default-prayer.jpg</code>.</p>
                )}
                {form.bgImageSource === 'url' && (
                  <label className="flex flex-col text-jkd-text">
                    <span className="text-sm">URL da Imagem</span>
                    <input type="text" name="bgImageUrl" value={form.bgImageUrl || ''} onChange={handleChange} className="input input-bordered" />
                  </label>
                )}
                {form.bgImageSource === 'upload' && (
                  <label className="flex flex-col text-jkd-text">
                    <span className="text-sm">Upload de Imagem</span>
                    <input type="file" accept="image/*" onChange={handleUploadBg} />
                    {form.bgImageUploadUrl && <span className="text-xs mt-1 break-all">{form.bgImageUploadUrl}</span>}
                  </label>
                )}
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Posicionamento</span>
                  <select name="bgPosition" value={form.bgPosition || 'center'} onChange={handleChange} className="input input-bordered">
                    <option value="top">Topo</option>
                    <option value="center">Centro</option>
                    <option value="bottom">Base</option>
                  </select>
                </label>
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Tamanho</span>
                  <select name="bgSize" value={form.bgSize || 'cover'} onChange={handleChange} className="input input-bordered">
                    <option value="cover">Estender (cover)</option>
                    <option value="contain">Conter</option>
                    <option value="auto">Auto</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-jkd-text">
                  <input type="checkbox" name="bgRepeat" checked={!!form.bgRepeat} onChange={handleChange} /> Repetir imagem
                </label>
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Opacidade (0–1)</span>
                  <input type="number" name="bgOpacity" min={0} max={1} step={0.05} value={form.bgOpacity || 0} onChange={handleChange} className="input input-bordered" />
                </label>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading flex items-center gap-2"><BarChart3 size={16}/> Estatísticas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div className="p-3 rounded border border-jkd-border bg-jkd-bg"><p className="text-xs text-jkd-text">Total de Pedidos Recebidos</p><p className="text-xl font-semibold text-jkd-heading">{stats.total}</p></div>
                <div className="p-3 rounded border border-jkd-border bg-jkd-bg"><p className="text-xs text-jkd-text">Pedidos Aprovados</p><p className="text-xl font-semibold text-green-600">{stats.approved}</p></div>
                <div className="p-3 rounded border border-jkd-border bg-jkd-bg"><p className="text-xs text-jkd-text">Pedidos Pendentes</p><p className="text-xl font-semibold text-yellow-600">{stats.pending}</p></div>
                <div className="p-3 rounded border border-jkd-border bg-jkd-bg"><p className="text-xs text-jkd-text">Total de Orações Registradas</p><p className="text-xl font-semibold text-church-primary">{stats.totalPrayers}</p></div>
              </div>
            </div>

            {/* Exportar CSV */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading flex items-center gap-2"><FileDown size={16}/> Exportar CSV</h2>
              <div className="flex flex-col sm:flex-row gap-3 mt-2 items-end">
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Filtrar por Status (opcional)</span>
                  <select value={exportStatus} onChange={(e)=>setExportStatus(e.target.value as any)} className="input input-bordered">
                    <option value="todos">Todos os Status</option>
                    <option value="approved">Aprovado</option>
                    <option value="pending">Pendente</option>
                    <option value="rejected">Rejeitado</option>
                  </select>
                </label>
                <button className="btn btn-primary" onClick={exportCsv}>Exportar CSV</button>
              </div>
              <p className="text-xs text-jkd-text mt-1">Observação: antes da aprovação, o pedido não é exibido no card público.</p>
            </div>

            {/* Botão de Salvar acima das ações destrutivas */}
            <div className="pt-2 flex justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-church-primary text-white hover:bg-church-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                onClick={save}
              >
                Salvar alterações
              </button>
            </div>

            {/* Exclusão em massa */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading flex items-center gap-2 text-red-600"><AlertTriangle size={16}/> Ações destrutivas</h2>
              <p className="text-sm text-jkd-text">Atenção: As ações abaixo são destrutivas e não podem ser desfeitas. Faça um backup do seu banco de dados antes de prosseguir.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Filtrar por Status (opcional)</span>
                  <select value={bulkStatus} onChange={(e)=>setBulkStatus(e.target.value as any)} className="input input-bordered">
                    <option value="todos">Todos os Status</option>
                    <option value="approved">Aprovado</option>
                    <option value="pending">Pendente</option>
                    <option value="rejected">Rejeitado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </label>
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Excluir registros criados antes de</span>
                  <input type="date" value={bulkBeforeDate} onChange={(e)=>setBulkBeforeDate(e.target.value)} className="input input-bordered" />
                </label>
                <div className="flex items-end">
                  <button className="btn btn-error flex items-center gap-2" onClick={bulkDelete}><Trash2 size={16}/> Excluir em massa</button>
                </div>
              </div>
            </div>
          </div>
  );

  if (embed) {
    return (
      <div>
        {loading ? (
          <p className="text-jkd-text mt-2">Carregando...</p>
        ) : (
          Content
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-6">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-jkd-heading">Configurações — Área Restrita</h1>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-jkd-text">Configure o mural de oração, plano de fundo e utilidades.</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/site/pedido-de-oracao')}
              className="px-3 py-2 rounded-md border border-jkd-border text-jkd-heading hover:bg-jkd-bg"
            >
              Voltar
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-jkd-text mt-6">Carregando...</p>
        ) : (
          <div className="mt-6 bg-jkd-bg-sec border border-jkd-border rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col text-jkd-text">
                <span className="text-sm">Pedidos por página</span>
                <input type="number" name="prayersPerPage" value={form.prayersPerPage} onChange={handleChange} className="input input-bordered" />
              </label>
              <label className="flex flex-col text-jkd-text">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="hideArchivedOnWall" checked={form.hideArchivedOnWall} onChange={handleChange} /> Ocultar arquivados no mural
                </div>
                <span className="text-xs text-jkd-text mt-1">Quando ativado, pedidos arquivados não aparecem no mural público.</span>
              </label>
              <label className="flex flex-col text-jkd-text">
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="allowUnpray" checked={form.allowUnpray} onChange={handleChange} /> Permitir "desorar"
                </div>
                <span className="text-xs text-jkd-text mt-1">Permite desfazer o “Orando”, removendo o coração do usuário.</span>
              </label>
              <label className="flex flex-col text-jkd-text">
                <span className="text-sm">Ícone coração preenchido (URL)</span>
                <input type="text" name="heartIconFilledUrl" value={form.heartIconFilledUrl || ''} onChange={handleChange} className="input input-bordered" />
              </label>
              <label className="flex flex-col text-jkd-text">
                <span className="text-sm">Ícone coração contorno (URL)</span>
                <input type="text" name="heartIconOutlineUrl" value={form.heartIconOutlineUrl || ''} onChange={handleChange} className="input input-bordered" />
              </label>
            </div>

            <label className="flex flex-col text-jkd-text">
              <span className="text-sm">E-mails para notificação (separados por vírgula)</span>
              <input type="text" value={form.notificationEmails.join(', ')} onChange={(e) => handleEmails(e.target.value)} className="input input-bordered" />
            </label>

            {/* Cores dos Motivos */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading">Cores dos Motivos</h2>
              <p className="text-xs text-jkd-text">Defina a cor de fundo exibida no badge do motivo nos cards do mural. Deixe em branco para usar a cor padrão do tema.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {motifs.map((m) => {
                  const val = (form.motifColors || {})[m] || '';
                  return (
                    <div key={m} className="flex items-center justify-between gap-3 border border-jkd-border rounded p-2 bg-jkd-bg">
                      <span className="text-sm text-jkd-text">{motifLabel(m)}</span>
                      <div className="flex items-center gap-2">
                        <input type="color" value={val || '#ffffff'} onChange={(e)=>{
                          const color = e.target.value;
                          setForm(prev => ({ ...prev, motifColors: { ...(prev.motifColors||{}), [m]: color } }));
                        }} />
                        <button type="button" className="btn btn-sm" onClick={()=>{
                          setForm(prev => { const next = { ...(prev.motifColors||{}) }; delete next[m]; return { ...prev, motifColors: next }; });
                        }}>Limpar</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plano de Fundo */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading flex items-center gap-2"><Upload size={16}/> Plano de Fundo do Mural</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Fonte da Imagem</span>
                  <select name="bgImageSource" value={form.bgImageSource || 'plugin'} onChange={handleChange} className="input input-bordered">
                    <option value="plugin">Plugin (padrão)</option>
                    <option value="url">URL</option>
                    <option value="upload">Upload</option>
                  </select>
                </label>
                {form.bgImageSource === 'plugin' && (
                  <p className="text-xs text-jkd-text sm:col-span-2">Usando imagem do plugin em <code>/mural-de-oracao/assets/images/placeholders/default-prayer.jpg</code>.</p>
                )}
                {form.bgImageSource === 'url' && (
                  <label className="flex flex-col text-jkd-text">
                    <span className="text-sm">URL da Imagem</span>
                    <input type="text" name="bgImageUrl" value={form.bgImageUrl || ''} onChange={handleChange} className="input input-bordered" />
                  </label>
                )}
                {form.bgImageSource === 'upload' && (
                  <label className="flex flex-col text-jkd-text">
                    <span className="text-sm">Upload de Imagem</span>
                    <input type="file" accept="image/*" onChange={handleUploadBg} />
                    {form.bgImageUploadUrl && <span className="text-xs mt-1 break-all">{form.bgImageUploadUrl}</span>}
                  </label>
                )}
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Posicionamento</span>
                  <select name="bgPosition" value={form.bgPosition || 'center'} onChange={handleChange} className="input input-bordered">
                    <option value="top">Topo</option>
                    <option value="center">Centro</option>
                    <option value="bottom">Base</option>
                  </select>
                </label>
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Tamanho</span>
                  <select name="bgSize" value={form.bgSize || 'cover'} onChange={handleChange} className="input input-bordered">
                    <option value="cover">Estender (cover)</option>
                    <option value="contain">Conter</option>
                    <option value="auto">Auto</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-jkd-text">
                  <input type="checkbox" name="bgRepeat" checked={!!form.bgRepeat} onChange={handleChange} /> Repetir imagem
                </label>
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Opacidade (0–1)</span>
                  <input type="number" name="bgOpacity" min={0} max={1} step={0.05} value={form.bgOpacity || 0} onChange={handleChange} className="input input-bordered" />
                </label>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading flex items-center gap-2"><BarChart3 size={16}/> Estatísticas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div className="p-3 rounded border border-jkd-border bg-jkd-bg"><p className="text-xs text-jkd-text">Total de Pedidos Recebidos</p><p className="text-xl font-semibold text-jkd-heading">{stats.total}</p></div>
                <div className="p-3 rounded border border-jkd-border bg-jkd-bg"><p className="text-xs text-jkd-text">Pedidos Aprovados</p><p className="text-xl font-semibold text-green-600">{stats.approved}</p></div>
                <div className="p-3 rounded border border-jkd-border bg-jkd-bg"><p className="text-xs text-jkd-text">Pedidos Pendentes</p><p className="text-xl font-semibold text-yellow-600">{stats.pending}</p></div>
                <div className="p-3 rounded border border-jkd-border bg-jkd-bg"><p className="text-xs text-jkd-text">Total de Orações Registradas</p><p className="text-xl font-semibold text-church-primary">{stats.totalPrayers}</p></div>
              </div>
            </div>

            {/* Exportar CSV */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading flex items-center gap-2"><FileDown size={16}/> Exportar CSV</h2>
              <div className="flex flex-col sm:flex-row gap-3 mt-2 items-end">
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Filtrar por Status (opcional)</span>
                  <select value={exportStatus} onChange={(e)=>setExportStatus(e.target.value as any)} className="input input-bordered">
                    <option value="todos">Todos os Status</option>
                    <option value="approved">Aprovado</option>
                    <option value="pending">Pendente</option>
                    <option value="rejected">Rejeitado</option>
                  </select>
                </label>
                <button className="btn btn-primary" onClick={exportCsv}>Exportar CSV</button>
              </div>
              <p className="text-xs text-jkd-text mt-1">Observação: antes da aprovação, o pedido não é exibido no card público.</p>
            </div>

            {/* Botão de Salvar acima das ações destrutivas */}
            <div className="pt-2">
              <button
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 bg-church-primary text-white hover:bg-church-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary"
                onClick={save}
              >
                Salvar alterações
              </button>
            </div>

            {/* Exclusão em massa */}
            <div className="border-t border-jkd-border pt-3">
              <h2 className="text-lg font-semibold text-jkd-heading flex items-center gap-2 text-red-600"><AlertTriangle size={16}/> Ações destrutivas</h2>
              <p className="text-sm text-jkd-text">Atenção: As ações abaixo são destrutivas e não podem ser desfeitas. Faça um backup do seu banco de dados antes de prosseguir.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Filtrar por Status (opcional)</span>
                  <select value={bulkStatus} onChange={(e)=>setBulkStatus(e.target.value as any)} className="input input-bordered">
                    <option value="todos">Todos os Status</option>
                    <option value="approved">Aprovado</option>
                    <option value="pending">Pendente</option>
                    <option value="rejected">Rejeitado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </label>
                <label className="flex flex-col text-jkd-text">
                  <span className="text-sm">Excluir registros criados antes de</span>
                  <input type="date" value={bulkBeforeDate} onChange={(e)=>setBulkBeforeDate(e.target.value)} className="input input-bordered" />
                </label>
                <div className="flex items-end">
                  <button className="btn btn-error flex items-center gap-2" onClick={bulkDelete}><Trash2 size={16}/> Excluir em massa</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntercessaoAdminPage;