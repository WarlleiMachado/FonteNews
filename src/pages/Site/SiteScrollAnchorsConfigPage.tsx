import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import { useToast } from '../../contexts/ToastContext';
import type { SiteScrollAnchor } from '../../types';

const emptyAnchor: SiteScrollAnchor = { key: '', selector: '', offsetPx: 56, title: '', enabled: true };

const SiteScrollAnchorsConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();

  const [enabled, setEnabled] = useState<boolean>(Boolean(settings.sliderScrollEnabled ?? true));
  const [origin, setOrigin] = useState<string>(settings.sliderMessageOrigin || '');
  const [anchors, setAnchors] = useState<SiteScrollAnchor[]>(settings.sliderScrollAnchors || []);
  const [newItem, setNewItem] = useState<SiteScrollAnchor>({ ...emptyAnchor });
  const [saving, setSaving] = useState(false);

  const appHostHint = useMemo(() => {
    try {
      const host = window.location.origin;
      return host;
    } catch {
      return 'https://fontenews-877a3.web.app';
    }
  }, []);

  if (!user || user.role !== 'admin') {
    navigate('/site');
    return null;
  }

  const addAnchor = () => {
    const key = (newItem.key || '').trim();
    const selector = (newItem.selector || '').trim();
    if (!key || !selector) {
      showToast('error', 'Informe chave e seletor.');
      return;
    }
    if (anchors.find(a => a.key === key)) {
      showToast('error', 'Já existe uma âncora com esta chave.');
      return;
    }
    setAnchors(prev => [...prev, { ...newItem, key, selector }]);
    setNewItem({ ...emptyAnchor });
  };

  const removeAnchor = (key: string) => {
    setAnchors(prev => prev.filter(a => a.key !== key));
  };

  const updateAnchor = (idx: number, next: Partial<SiteScrollAnchor>) => {
    setAnchors(prev => prev.map((a, i) => (i === idx ? { ...a, ...next } : a)));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings({
        sliderScrollEnabled: enabled,
        sliderMessageOrigin: origin.trim(),
        sliderScrollAnchors: anchors,
      });
      showToast('success', 'Configurações de âncoras salvas com sucesso');
    } catch (e: any) {
      showToast('error', e?.message || 'Falha ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-jkd-heading">Rolagem por Botões do Slider (WP)</h1>
        <p className="text-jkd-text mt-2">Defina âncoras deste App e a origem do iframe para permitir que botões do Slider (WordPress) rolem até seções específicas da Home do Site.</p>

        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Habilitar rolagem por postMessage</label>
              <label className="inline-flex items-center gap-2 text-jkd-text">
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                <span>Ativar integração de rolagem</span>
              </label>
              <p className="text-xs text-jkd-text mt-2">Quando habilitado, a Home escuta mensagens do iframe e rola suavemente até o seletor configurado.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Origem esperada do iframe (WordPress)</label>
              <input
                type="text"
                placeholder="https://seuwordpress.com"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text placeholder-jkd-text/60 focus:outline-none focus:ring-2 focus:ring-church-primary"
              />
              <p className="text-xs text-jkd-text mt-2">Recomendado por segurança. Use o domínio do seu site WordPress (sem barra final). Ex.: https://exemplo.com</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-jkd-heading">Âncoras</h2>
            <p className="text-sm text-jkd-text mt-1">Cada âncora associa uma <em>chave</em> (usada no botão do WordPress) a um <em>seletor CSS</em> existente nesta página.</p>

            <div className="mt-4 space-y-3">
              {anchors.length === 0 && (
                <div className="text-sm text-jkd-text">Nenhuma âncora definida.</div>
              )}
              {anchors.map((a, idx) => (
                <div key={a.key} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-jkd-heading mb-1">Chave</label>
                    <input value={a.key} onChange={e => updateAnchor(idx, { key: e.target.value })} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-jkd-heading mb-1">Seletor CSS</label>
                    <input value={a.selector} onChange={e => updateAnchor(idx, { selector: e.target.value })} placeholder="#agenda, .secao-contatos" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-jkd-heading mb-1">Offset (px)</label>
                    <input type="number" value={a.offsetPx ?? 0} onChange={e => updateAnchor(idx, { offsetPx: Number(e.target.value) || 0 })} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-jkd-heading mb-1">Ativo</label>
                    <input type="checkbox" checked={Boolean(a.enabled ?? true)} onChange={e => updateAnchor(idx, { enabled: e.target.checked })} />
                  </div>
                  <div className="md:col-span-1">
                    <button type="button" onClick={() => removeAnchor(a.key)} className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Remover</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 border border-jkd-border rounded-lg bg-jkd-bg">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-jkd-heading mb-1">Chave</label>
                  <input value={newItem.key} onChange={e => setNewItem(prev => ({ ...prev, key: e.target.value }))} placeholder="agenda" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-jkd-heading mb-1">Seletor CSS</label>
                  <input value={newItem.selector} onChange={e => setNewItem(prev => ({ ...prev, selector: e.target.value }))} placeholder="#agenda, .secao-contatos" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-jkd-heading mb-1">Offset (px)</label>
                  <input type="number" value={newItem.offsetPx ?? 0} onChange={e => setNewItem(prev => ({ ...prev, offsetPx: Number(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                </div>
                <div className="md:col-span-2">
                  <button type="button" onClick={addAnchor} className="w-full px-3 py-2 bg-jkd-bg text-jkd-heading border border-jkd-border rounded-lg hover:bg-jkd-bg-sec">Adicionar Âncora</button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-70">
              <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </div>

        {/* Guia de Integração */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-jkd-heading">Como configurar no WordPress</h2>
          <p className="text-sm text-jkd-text">No plugin HTML do seu WordPress (na página do Slider), inclua um botão que envie a chave da âncora via postMessage para este App. Exemplo:</p>
          <pre className="text-xs bg-black/20 text-jkd-text p-3 rounded-md overflow-auto">
{`<!-- Botão no WordPress: substitua 'agenda' pela sua chave -->
<a href="#" onclick="window.parent.postMessage({ type: 'fonte-scroll', anchorKey: 'agenda' }, '${origin || appHostHint}'); return false;">
  Ir para Agenda
</a>`}
          </pre>
          <p className="text-xs text-jkd-text">Dica: se não quiser restringir a origem agora, use '*' temporariamente e depois configure "Origem esperada" acima para maior segurança.</p>
          <p className="text-xs text-jkd-text">Ao receber a mensagem, este App localizará o seletor da âncora correspondente e fará rolagem suave considerando o offset.</p>
        </div>

        {/* Guia de uso de âncoras */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-3">
          <h2 className="text-lg font-semibold text-jkd-heading">Dicas para criar âncoras</h2>
          <ul className="text-sm text-jkd-text list-disc ml-6">
            <li>Use seletores estáveis: IDs como <code>#agenda</code> ou classes como <code>.secao-contatos</code>.</li>
            <li>Você pode apontar para elementos já existentes na Home do Site. Se necessário, adicione IDs/classes nos componentes.</li>
            <li>Ajuste o <em>offset</em> para compensar o cabeçalho fixo (padrão ~56px).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SiteScrollAnchorsConfigPage;