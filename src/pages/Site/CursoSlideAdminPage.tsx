import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Save, Trash2, Eye, EyeOff, ArrowUpCircle, ArrowDownCircle, Edit3, Check } from 'lucide-react';

interface SlideDoc {
  id: string;
  title: string;
  category?: string;
  imageUrl: string;
  linkUrl?: string;
  target?: '_self' | '_blank';
  background?: string;
  order?: number;
  active?: boolean;
}

const emptyForm: Omit<SlideDoc, 'id'> = {
  title: '',
  category: '',
  imageUrl: '',
  linkUrl: '',
  target: '_self',
  background: '',
  order: 0,
  active: true,
};

const CursoSlideAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [slides, setSlides] = useState<SlideDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SlideDoc, 'id'>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Omit<SlideDoc, 'id'>>(emptyForm);

  const nextOrder = useMemo(() => {
    if (!slides.length) return 1;
    const max = Math.max(...slides.map(s => s.order ?? 0));
    return max + 1;
  }, [slides]);

  const loadSlides = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'course_slides'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      const list: SlideDoc[] = snap.docs.map(d => {
        const data: any = d.data();
        return {
          id: d.id,
          title: data.title || '',
          category: data.category || '',
          imageUrl: data.imageUrl || data.image || '',
          linkUrl: data.linkUrl || data.link || '',
          target: (data.target || '_self') as '_self' | '_blank',
          background: data.background || data.imageUrl || '',
          order: data.order ?? 0,
          active: data.active !== false,
        };
      });
      setSlides(list);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar slides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlides(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError('Título é obrigatório.'); return; }
    if (!form.imageUrl.trim()) { setError('Imagem (URL) é obrigatória.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category?.trim() || '',
        imageUrl: form.imageUrl.trim(),
        image: form.imageUrl.trim(),
        linkUrl: form.linkUrl?.trim() || '',
        link: form.linkUrl?.trim() || '',
        target: form.target || '_self',
        background: form.background?.trim() || form.imageUrl.trim(),
        order: nextOrder,
        active: form.active !== false,
      };
      await addDoc(collection(db, 'course_slides'), payload);
      setForm({ ...emptyForm });
      await loadSlides();
    } catch (e: any) {
      setError(e?.message || 'Erro ao adicionar slide');
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (s: SlideDoc) => {
    setEditingId(s.id);
    setEditBuffer({
      title: s.title,
      category: s.category || '',
      imageUrl: s.imageUrl,
      linkUrl: s.linkUrl || '',
      target: s.target || '_self',
      background: s.background || s.imageUrl,
      order: s.order ?? 0,
      active: s.active !== false,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    if (!editBuffer.title.trim()) { setError('Título é obrigatório.'); return; }
    if (!editBuffer.imageUrl.trim()) { setError('Imagem (URL) é obrigatória.'); return; }
    setSaving(true);
    try {
      const ref = doc(db, 'course_slides', editingId);
      const payload = {
        title: editBuffer.title.trim(),
        category: editBuffer.category?.trim() || '',
        imageUrl: editBuffer.imageUrl.trim(),
        image: editBuffer.imageUrl.trim(),
        linkUrl: editBuffer.linkUrl?.trim() || '',
        link: editBuffer.linkUrl?.trim() || '',
        target: editBuffer.target || '_self',
        background: editBuffer.background?.trim() || editBuffer.imageUrl.trim(),
        order: editBuffer.order ?? 0,
        active: editBuffer.active !== false,
      };
      await updateDoc(ref, payload as any);
      setEditingId(null);
      await loadSlides();
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: SlideDoc) => {
    try {
      await updateDoc(doc(db, 'course_slides', s.id), { active: !(s.active !== false) });
      await loadSlides();
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar status');
    }
  };

  const moveUp = async (s: SlideDoc) => {
    const idx = slides.findIndex(x => x.id === s.id);
    if (idx <= 0) return;
    const prev = slides[idx - 1];
    const a = s.order ?? 0;
    const b = prev.order ?? 0;
    try {
      await updateDoc(doc(db, 'course_slides', s.id), { order: b });
      await updateDoc(doc(db, 'course_slides', prev.id), { order: a });
      await loadSlides();
    } catch (e: any) {
      setError(e?.message || 'Erro ao reordenar');
    }
  };

  const moveDown = async (s: SlideDoc) => {
    const idx = slides.findIndex(x => x.id === s.id);
    if (idx < 0 || idx >= slides.length - 1) return;
    const next = slides[idx + 1];
    const a = s.order ?? 0;
    const b = next.order ?? 0;
    try {
      await updateDoc(doc(db, 'course_slides', s.id), { order: b });
      await updateDoc(doc(db, 'course_slides', next.id), { order: a });
      await loadSlides();
    } catch (e: any) {
      setError(e?.message || 'Erro ao reordenar');
    }
  };

  const remove = async (s: SlideDoc) => {
    if (!confirm('Excluir este slide?')) return;
    try {
      await deleteDoc(doc(db, 'course_slides', s.id));
      await loadSlides();
    } catch (e: any) {
      setError(e?.message || 'Erro ao excluir');
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-jkd-heading">Curso-Slide — Administração</h1>
        <p className="text-sm text-jkd-text mt-1">Gerencie os slides usados no slider da Home e página de Cursos.</p>

        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-5 h-5 text-church-primary" />
            <h2 className="text-lg font-medium text-jkd-heading">Adicionar novo slide</h2>
          </div>
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-jkd-heading">Título *</label>
              <input value={form.title} onChange={e=>setForm(f=>({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
            </div>
            <div>
              <label className="text-sm font-medium text-jkd-heading">Categoria</label>
              <input value={form.category} onChange={e=>setForm(f=>({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-jkd-heading">Imagem (URL) *</label>
              <input value={form.imageUrl} onChange={e=>setForm(f=>({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
            </div>
            <div>
              <label className="text-sm font-medium text-jkd-heading">Link</label>
              <input value={form.linkUrl} onChange={e=>setForm(f=>({ ...f, linkUrl: e.target.value }))} placeholder="https://... ou /site/cursos" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
            </div>
            <div>
              <label className="text-sm font-medium text-jkd-heading">Target</label>
              <select value={form.target} onChange={e=>setForm(f=>({ ...f, target: e.target.value as '_self' | '_blank' }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
                <option value="_self">Abrir na mesma aba</option>
                <option value="_blank">Abrir em nova aba</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-jkd-heading">Fundo (opcional)</label>
              <input value={form.background} onChange={e=>setForm(f=>({ ...f, background: e.target.value }))} placeholder="URL para fundo (se diferente da imagem)" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
            </div>
            <div className="flex items-center gap-2">
              <input id="active" type="checkbox" checked={form.active !== false} onChange={e=>setForm(f=>({ ...f, active: e.target.checked }))} />
              <label htmlFor="active" className="text-sm text-jkd-heading">Ativo</label>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-60">
                <Save size={16} />
                <span>{saving ? 'Salvando...' : 'Adicionar slide'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
          <div className="flex items-center gap-2 mb-3">
            <Edit3 className="w-5 h-5 text-church-primary" />
            <h2 className="text-lg font-medium text-jkd-heading">Slides existentes</h2>
          </div>
          {loading ? (
            <div className="text-jkd-text">Carregando...</div>
          ) : slides.length === 0 ? (
            <div className="text-jkd-text">Nenhum slide cadastrado.</div>
          ) : (
            <div className="space-y-4">
              {slides.map(s => (
                <div key={s.id} className="bg-jkd-bg rounded-lg border border-jkd-border p-3">
                  {editingId === s.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-jkd-heading">Título *</label>
                        <input value={editBuffer.title} onChange={e=>setEditBuffer(b=>({ ...b, title: e.target.value }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-jkd-heading">Categoria</label>
                        <input value={editBuffer.category} onChange={e=>setEditBuffer(b=>({ ...b, category: e.target.value }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-jkd-heading">Imagem (URL) *</label>
                        <input value={editBuffer.imageUrl} onChange={e=>setEditBuffer(b=>({ ...b, imageUrl: e.target.value }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-jkd-heading">Link</label>
                        <input value={editBuffer.linkUrl} onChange={e=>setEditBuffer(b=>({ ...b, linkUrl: e.target.value }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-jkd-heading">Target</label>
                        <select value={editBuffer.target} onChange={e=>setEditBuffer(b=>({ ...b, target: e.target.value as '_self' | '_blank' }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
                          <option value="_self">_self</option>
                          <option value="_blank">_blank</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-jkd-heading">Fundo</label>
                        <input value={editBuffer.background} onChange={e=>setEditBuffer(b=>({ ...b, background: e.target.value }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-jkd-heading">Ordem</label>
                        <input type="number" value={editBuffer.order ?? 0} onChange={e=>setEditBuffer(b=>({ ...b, order: Number(e.target.value) }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input id={`active-${s.id}`} type="checkbox" checked={editBuffer.active !== false} onChange={e=>setEditBuffer(b=>({ ...b, active: e.target.checked }))} />
                        <label htmlFor={`active-${s.id}`} className="text-sm text-jkd-heading">Ativo</label>
                      </div>
                      <div className="md:col-span-2 flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="px-3 py-2 border border-jkd-border rounded-lg text-jkd-heading bg-jkd-bg">Cancelar</button>
                        <button type="button" onClick={saveEdit} disabled={saving} className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-60">
                          <Check size={16} />
                          <span>Salvar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-16 bg-jkd-bg-sec border border-jkd-border rounded overflow-hidden">
                        {s.imageUrl && <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-jkd-heading font-medium">{s.title}</div>
                        <div className="text-xs text-jkd-text">{s.category || '—'} · ordem {s.order ?? 0} · {s.active !== false ? 'ativo' : 'inativo'}</div>
                        {s.linkUrl && <a href={s.linkUrl} target={s.target || '_self'} className="text-xs text-church-primary">{s.linkUrl}</a>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button title="Editar" onClick={() => beginEdit(s)} className="px-3 py-2 border border-jkd-border rounded-lg text-jkd-heading bg-jkd-bg">Editar</button>
                        <button title="Ativar/Inativar" onClick={() => toggleActive(s)} className="inline-flex items-center gap-1 px-3 py-2 border border-jkd-border rounded-lg text-jkd-heading bg-jkd-bg">
                          {s.active !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                          <span>{s.active !== false ? 'Desativar' : 'Ativar'}</span>
                        </button>
                        <button title="Mover para cima" onClick={() => moveUp(s)} className="px-3 py-2 border border-jkd-border rounded-lg text-jkd-heading bg-jkd-bg"><ArrowUpCircle size={16} /></button>
                        <button title="Mover para baixo" onClick={() => moveDown(s)} className="px-3 py-2 border border-jkd-border rounded-lg text-jkd-heading bg-jkd-bg"><ArrowDownCircle size={16} /></button>
                        <button title="Excluir" onClick={() => remove(s)} className="px-3 py-2 bg-red-600 text-white rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CursoSlideAdminPage;