import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { MinistryDepartment } from '../../types';
import { uploadImage } from '../../services/uploadService';
import { updateMinistryDepartment as updateMinistryDepartmentInFirestore } from '../../services/firestoreService';
import { useToast } from '../../contexts/ToastContext';

// Utilities
const slugify = (text: string) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

type EditableMinistry = Omit<MinistryDepartment, 'logoUrl' | 'highlightUrl'> & {
  logoUrl?: string;
  highlightUrl?: string;
};

const emptyForm: EditableMinistry = {
  id: '',
  name: '',
  slug: '',
  description: '',
  leaderIds: [],
  colorHex: '#9ca3af',
  order: 99,
  active: true,
  gradientHeightPx: 160,
  gradientIntensityPercent: 65,
};

export default function MinisteriosConfigPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    ministryDepartments,
    addMinistryDepartment,
    deleteMinistryDepartment,
  } = useApp();
  const { showToast } = useToast();

  const [form, setForm] = useState<EditableMinistry>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [highlightFile, setHighlightFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/site');
    }
  }, [user, navigate]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ministryDepartments;
    return ministryDepartments.filter((m) =>
      [m.name, m.slug, m.description].some((f) => f?.toLowerCase().includes(q))
    );
  }, [filter, ministryDepartments]);

  const resetForm = () => {
    setForm(emptyForm);
    setLogoFile(null);
    setHighlightFile(null);
  };

  const handleSelect = (m: MinistryDepartment) => {
    setForm({ ...m });
    setLogoFile(null);
    setHighlightFile(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    const numericFields = new Set(['order', 'gradientHeightPx', 'gradientIntensityPercent']);
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : numericFields.has(name) ? Number(value) : value,
      ...(name === 'name' && !prev.id ? { slug: slugify(value) } : {}),
    }));
  };

  const uploadIfNeeded = async (
    baseSlug: string
  ): Promise<{ logoUrl?: string; highlightUrl?: string }> => {
    const updates: { logoUrl?: string; highlightUrl?: string } = {};
    const timestamp = Date.now();

    if (logoFile) {
      const path = `images/ministerios/${baseSlug}/logo-${timestamp}-${logoFile.name}`;
      updates.logoUrl = await uploadImage(logoFile, path);
    }
    if (highlightFile) {
      const path = `images/ministerios/${baseSlug}/highlight-${timestamp}-${highlightFile.name}`;
      updates.highlightUrl = await uploadImage(highlightFile, path);
    }
    return updates;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const baseSlug = form.slug || slugify(form.name);
      const assetUpdates = await uploadIfNeeded(baseSlug);

      if (!form.name.trim()) throw new Error('Nome é obrigatório');

      const payload: MinistryDepartment = {
        ...form,
        slug: baseSlug,
        logoUrl: assetUpdates.logoUrl ?? form.logoUrl ?? '',
        highlightUrl: assetUpdates.highlightUrl ?? form.highlightUrl ?? '',
        gradientHeightPx: form.gradientHeightPx ?? 160,
        gradientIntensityPercent: form.gradientIntensityPercent ?? 65,
      } as MinistryDepartment;

      if (!form.id) {
        // Criar novo ministério (sem campo id)
        const { id: _omitId, ...createData } = payload;
        await addMinistryDepartment(createData);
        showToast('success', 'Ministério criado com sucesso.');
      } else {
        // Atualizar ministério existente usando assinatura (id, updates)
        const { id, ...updates } = payload;
        await updateMinistryDepartmentInFirestore(id, updates);
        showToast('success', 'Alterações salvas com sucesso.');
      }

      resetForm();
    } catch (err) {
      console.error(err);
      const msg = (err as Error).message || 'Erro ao salvar';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este ministério?')) return;
    try {
      setSaving(true);
      await deleteMinistryDepartment(id);
      if (form.id === id) resetForm();
      showToast('success', 'Ministério excluído com sucesso.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Erro ao excluir');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (m: MinistryDepartment) => {
    try {
      setSaving(true);
      await updateMinistryDepartmentInFirestore(m.id, { active: !m.active });
      showToast('success', !m.active ? 'Ministério visível na página.' : 'Ministério ocultado da página.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Falha ao atualizar visibilidade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Configuração de Ministérios</h1>
        <div className="flex gap-2">
          <input
            placeholder="Filtrar..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <button 
            onClick={() => { resetForm(); showToast('info', 'Novo ministério: preencha e clique em Salvar.'); }}
            className="rounded bg-indigo-600 px-3 py-2 text-white"
          >
            Novo
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50"
            title="Salvar"
          >
            Salvar
          </button>
          <button onClick={() => { resetForm(); showToast('info', 'Formulário limpo.'); }} className="rounded bg-gray-200 px-3 py-2">
            Limpar formulário
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <section className="md:col-span-1">
          <div className="rounded border">
            <ul>
              {filtered.map((m) => (
                <li key={m.id} className="flex items-center justify-between border-b px-3 py-2">
                  <div className="flex items-center gap-3">
                    {m.logoUrl && (
                      <img src={m.logoUrl} alt={m.name} className="h-8 w-8 rounded bg-white border border-jkd-border object-contain" />
                    )}
                    <button
                      className="text-left hover:underline"
                      onClick={() => handleSelect(m)}
                      title="Editar"
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="ml-2 text-xs text-gray-500">/{m.slug}</span>
                      {m.active === false && (
                        <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">Oculto</span>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="text-sm text-indigo-600 hover:underline"
                      onClick={() => handleSelect(m)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-sm text-jkd-heading hover:underline"
                      onClick={() => handleToggleVisibility(m)}
                      title={m.active === false ? 'Mostrar na página' : 'Ocultar da página'}
                    >
                      {m.active === false ? 'Mostrar' : 'Ocultar'}
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(m.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
              {!filtered.length && (
                <li className="px-3 py-3 text-gray-500">Nenhum ministério encontrado</li>
              )}
            </ul>
          </div>
        </section>

        <section className="md:col-span-2">
          <div className="rounded border p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col">
                <span className="text-sm">Nome</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="rounded border px-3 py-2"
                />
              </label>

              {/* Configuração do degradê do herói */}
              <label className="flex flex-col">
                <span className="text-sm">Altura do degradê (px)</span>
                <input
                  type="range"
                  name="gradientHeightPx"
                  min={60}
                  max={360}
                  step={10}
                  value={form.gradientHeightPx ?? 160}
                  onChange={handleChange}
                  className="w-full"
                />
                <span className="text-xs text-jkd-text mt-1">{form.gradientHeightPx ?? 160}px</span>
              </label>

              <label className="flex flex-col">
                <span className="text-sm">Intensidade do degradê (%)</span>
                <input
                  type="range"
                  name="gradientIntensityPercent"
                  min={0}
                  max={100}
                  step={5}
                  value={form.gradientIntensityPercent ?? 65}
                  onChange={handleChange}
                  className="w-full"
                />
                <span className="text-xs text-jkd-text mt-1">{form.gradientIntensityPercent ?? 65}%</span>
              </label>

              <label className="flex flex-col">
                <span className="text-sm">Slug</span>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="rounded border px-3 py-2"
                />
              </label>

              <label className="col-span-1 md:col-span-2 flex flex-col">
                <span className="text-sm">Descrição</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="rounded border px-3 py-2"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm">Cor (hex)</span>
                <input
                  type="color"
                  name="colorHex"
                  value={form.colorHex || '#9ca3af'}
                  onChange={handleChange}
                  className="h-10 w-16 rounded border"
                />
              </label>

              <label className="flex flex-col">
                <span className="text-sm">Ordem</span>
                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleChange}
                  className="rounded border px-3 py-2"
                />
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                />
                <span className="text-sm">Visível na página "Ministérios"</span>
              </label>

              <label className="flex flex-col">
                <span className="text-sm">Logo (PNG/JPG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="rounded border px-3 py-2"
                />
                {form.logoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.logoUrl} alt={form.name} className="h-10 w-10 rounded bg-white border border-jkd-border object-contain" />
                    <a href={form.logoUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline">
                      Abrir logo atual
                    </a>
                  </div>
                )}
              </label>

              <label className="flex flex-col">
                <span className="text-sm">Highlight (PNG/JPG)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setHighlightFile(e.target.files?.[0] || null)}
                  className="rounded border px-3 py-2"
                />
                {form.highlightUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.highlightUrl} alt={form.name} className="h-12 w-12 rounded bg-white border border-jkd-border object-cover" />
                    <a href={form.highlightUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline">
                      Abrir destaque atual
                    </a>
                  </div>
                )}
              </label>
            </div>

            {/* Botões principais estão no topo para evitar duplicidade e confusão */}
          </div>
        </section>
      </div>
    </div>
  );
}