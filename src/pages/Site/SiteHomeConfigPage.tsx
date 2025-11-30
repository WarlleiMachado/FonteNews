import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { useToast } from '../../contexts/ToastContext';
import { uploadImage } from '../../services/uploadService';
import type { SiteHomeSettings } from '../../types';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const SiteHomeConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();

  const initial: SiteHomeSettings = useMemo(() => ({
    bgImageSource: settings.siteHome?.bgImageSource || 'url',
    bgImageUrl: settings.siteHome?.bgImageUrl || '',
    bgImageUploadUrl: settings.siteHome?.bgImageUploadUrl || '',
    bgRepeat: Boolean(settings.siteHome?.bgRepeat),
    bgSize: settings.siteHome?.bgSize || 'cover',
    bgPosition: settings.siteHome?.bgPosition || 'center',
    bgOpacity: typeof settings.siteHome?.bgOpacity === 'number' ? settings.siteHome.bgOpacity : 0.35,
    leftColSpan: settings.siteHome?.leftColSpan || 4,
    rightColSpan: settings.siteHome?.rightColSpan || 8,
  }), [settings.siteHome]);

  const [form, setForm] = useState<SiteHomeSettings>(initial);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/site');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Mantém colunas como soma 12
    const left = clamp(Number(form.leftColSpan || 6), 1, 11);
    const right = clamp(12 - left, 1, 11);
    setForm(prev => ({ ...prev, leftColSpan: left, rightColSpan: right }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.leftColSpan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'bgOpacity' || name === 'leftColSpan' || name === 'rightColSpan' ? Number(value) : value,
    }));
  };

  const handleUploadIfNeeded = async (): Promise<string | undefined> => {
    if (form.bgImageSource !== 'upload') return undefined;
    if (!imageFile && form.bgImageUploadUrl) return form.bgImageUploadUrl;
    if (!imageFile) return undefined;
    const timestamp = Date.now();
    const path = `images/site/home-bg/bg-${timestamp}-${imageFile.name}`;
    const url = await uploadImage(imageFile, path);
    return url;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const uploadUrl = await handleUploadIfNeeded();
      const updates: SiteHomeSettings = {
        ...form,
        bgOpacity: clamp(form.bgOpacity ?? 0.35, 0, 1),
        leftColSpan: clamp(form.leftColSpan ?? 4, 1, 11),
        rightColSpan: clamp(form.rightColSpan ?? 8, 1, 11),
        ...(typeof uploadUrl === 'string' ? { bgImageUploadUrl: uploadUrl } : {}),
      };

      // Se a fonte selecionada for "upload", usar a URL de upload como imagem efetiva
      if (updates.bgImageSource === 'upload' && updates.bgImageUploadUrl) {
        updates.bgImageUrl = updates.bgImageUploadUrl;
      }

      await updateSettings({ siteHome: updates } as any);
      showToast('success', 'Configurações da Home salvas com sucesso');
    } catch (e: any) {
      console.error('Erro ao salvar configurações da Home:', e);
      showToast('error', e?.message || 'Falha ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const spanClass = (n: number) => {
    const map: Record<number, string> = {
      1: 'lg:col-span-1',
      2: 'lg:col-span-2',
      3: 'lg:col-span-3',
      4: 'lg:col-span-4',
      5: 'lg:col-span-5',
      6: 'lg:col-span-6',
      7: 'lg:col-span-7',
      8: 'lg:col-span-8',
      9: 'lg:col-span-9',
      10: 'lg:col-span-10',
      11: 'lg:col-span-11',
      12: 'lg:col-span-12',
    };
    return map[n] || 'lg:col-span-6';
  };

  const previewBgUrl = form.bgImageSource === 'upload' ? (form.bgImageUploadUrl || '') : (form.bgImageUrl || '');

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-jkd-heading">Configurações da Home do Site</h1>
        <p className="text-jkd-text mt-2">Defina imagem de fundo, opacidade e largura das colunas.</p>

        {/* Preview simples */}
        <div className="mt-6 rounded-lg border border-jkd-border overflow-hidden">
          <div className="relative h-40">
            {previewBgUrl && (
              <div
                className="absolute inset-0 bg-center"
                style={{
                  backgroundImage: `url(${previewBgUrl})`,
                  backgroundSize: form.bgSize || 'cover',
                  backgroundPosition: form.bgPosition || 'center',
                  backgroundRepeat: form.bgRepeat ? 'repeat' : 'no-repeat',
                  opacity: clamp(form.bgOpacity ?? 0.35, 0, 1),
                }}
              />
            )}
            <div className="absolute inset-0 grid grid-cols-12">
              <div className={`hidden lg:block ${spanClass(form.leftColSpan || 4)} bg-church-primary/10`} />
              <div className={`hidden lg:block ${spanClass(form.rightColSpan || 8)} bg-jkd-bg/10`} />
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Fonte da imagem de fundo</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input type="radio" name="bgImageSource" value="url" checked={form.bgImageSource === 'url'} onChange={handleChange} />
                  <span className="text-jkd-text">URL direta</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="bgImageSource" value="upload" checked={form.bgImageSource === 'upload'} onChange={handleChange} />
                  <span className="text-jkd-text">Upload</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Opacidade do fundo</label>
              <input type="range" name="bgOpacity" min={0} max={1} step={0.05} value={form.bgOpacity ?? 0.35} onChange={handleChange} className="w-full" />
              <div className="text-xs text-jkd-text mt-1">{Math.round((form.bgOpacity ?? 0.35) * 100)}%</div>
            </div>
          </div>

          {form.bgImageSource === 'url' && (
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-1">URL da imagem de fundo</label>
              <input name="bgImageUrl" value={form.bgImageUrl || ''} onChange={handleChange} placeholder="https://exemplo.com/imagem.jpg" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
            </div>
          )}
          {form.bgImageSource === 'upload' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Arquivo de imagem</label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                {form.bgImageUploadUrl && <div className="text-xs text-jkd-text mt-1 truncate">Atual: {form.bgImageUploadUrl}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">URL final (preenchida após upload)</label>
                <input value={form.bgImageUploadUrl || ''} onChange={e=> setForm(prev=> ({...prev, bgImageUploadUrl: e.target.value}))} placeholder="Preenchida automaticamente após upload" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-1">Repetição</label>
              <label className="inline-flex items-center gap-2 text-jkd-text">
                <input type="checkbox" name="bgRepeat" checked={!!form.bgRepeat} onChange={handleChange} />
                <span>Repetir imagem (tiling)</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-1">Tamanho</label>
              <select name="bgSize" value={form.bgSize || 'cover'} onChange={handleChange} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
                <option value="cover">cover</option>
                <option value="contain">contain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-1">Posição</label>
              <select name="bgPosition" value={form.bgPosition || 'center'} onChange={handleChange} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text">
                <option value="center">center</option>
                <option value="top">top</option>
                <option value="bottom">bottom</option>
                <option value="left">left</option>
                <option value="right">right</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-1">Largura da coluna esquerda</label>
              <input type="range" name="leftColSpan" min={1} max={11} step={1} value={form.leftColSpan || 4} onChange={handleChange} className="w-full" />
              <div className="text-xs text-jkd-text mt-1">Esquerda: {form.leftColSpan || 4} | Direita: {form.rightColSpan || (12 - (form.leftColSpan || 4))}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-1">Direita (auto)</label>
              <input type="number" name="rightColSpan" value={form.rightColSpan || 8} min={1} max={11} onChange={handleChange} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              <div className="text-xs text-jkd-text mt-1">A soma deve ser 12.</div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/site/gerenciamento')} className="px-4 py-2 border border-jkd-border rounded-lg text-jkd-heading bg-jkd-bg">Voltar</button>
            <button type="button" disabled={saving} onClick={handleSave} className="px-4 py-2 bg-church-primary text-white rounded-lg disabled:opacity-60">Salvar Configurações</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteHomeConfigPage;