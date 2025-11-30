import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, UploadCloud, Copy, Search, Link as LinkIcon, Trash2 } from 'lucide-react';
import { listGalleryImages, uploadGalleryImage, uploadGalleryImageFromUrl, GalleryItem, deleteGalleryImage } from '../services/galleryService';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import InputPromptModal from '../components/Common/InputPromptModal';

const GaleriaPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [uploading, setUploading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'principal' | 'countdown'>('principal');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);

  // Formata o nome para esconder o ID inicial e priorizar o final
  const formatDisplayName = (raw: string, max = 32) => {
    const withoutId = raw.replace(/^[0-9]+_/, '');
    if (withoutId.length <= max) return withoutId;
    return '…' + withoutId.slice(-max);
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listGalleryImages(activeTab);
      setItems(list);
    } catch (err) {
      console.error('Erro ao listar galeria:', err);
      setError('Falha ao carregar a galeria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [activeTab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(it => {
      const matchesQuery = !q || it.name.toLowerCase().includes(q);
      const ext = (it.name.split('.').pop() || '').toLowerCase();
      const matchesType = typeFilter === 'todos' || ext === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [items, query, typeFilter]);

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('success', 'URL da imagem copiada!');
    } catch {
      showToast('error', 'Não foi possível copiar a URL.');
    }
  };

  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadGalleryImage(file, activeTab);
      showToast('success', 'Imagem enviada para a galeria!');
      await refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Falha no upload.');
    } finally {
      setUploading(false);
      // Reset input value to allow re-uploading same file
      try { e.target.value = ''; } catch {}
    }
  };

  const handleAddByUrl = async (imageUrl: string) => {
    setUploading(true);
    try {
      await uploadGalleryImageFromUrl(imageUrl, activeTab);
      showToast('success', 'Imagem importada pela URL!');
      await refresh();
    } catch (err: any) {
      showToast('error', err?.message || 'Falha ao importar por URL.');
    } finally {
      setUploading(false);
      setIsUrlModalOpen(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!user) {
      showToast('error', 'É necessário estar logado para excluir.');
      return;
    }
    const confirmed = window.confirm(`Excluir a imagem "${item.name}" da aba ${activeTab}? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;
    try {
      await deleteGalleryImage(item.fullPath);
      showToast('success', 'Imagem excluída da galeria.');
      await refresh();
    } catch (err: any) {
      const msg = err?.message || 'Falha ao excluir a imagem.';
      showToast('error', msg);
    }
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-8 w-8 text-church-primary" />
            <h1 className="text-3xl font-bold text-jkd-heading">Galeria</h1>
          </div>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-church-primary hover:text-church-primary/80">
            <ArrowLeft size={18} />
            <span>Voltar ao Painel</span>
          </Link>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-500/30 p-4 mb-6 text-blue-900 dark:text-blue-200">
          <p className="text-sm">
            As imagens desta Galeria são destinadas ao uso nas criações de <strong>Programações</strong> e <strong>Cultos</strong>. Para mantermos um ambiente organizado e ágil na hora de escolher uma imagem atual, pedimos gentilmente que as imagens sejam mantidas <strong>sempre atualizadas</strong>. 
            Caso alguma imagem não esteja mais sendo utilizada em postagens que já expiraram e não estão visíveis, por favor, <strong>exclua</strong> para colaborar com a boa organização de todos.
          </p>
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4 mb-6">
          <div className="flex gap-2 mb-3">
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${activeTab === 'principal' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg border-jkd-border text-jkd-text hover:bg-jkd-bg-sec'}`}
              onClick={() => setActiveTab('principal')}
            >
              Imagem Principal
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${activeTab === 'countdown' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg border-jkd-border text-jkd-text hover:bg-jkd-bg-sec'}`}
              onClick={() => setActiveTab('countdown')}
            >
              Destaque Countdown
            </button>
          </div>
          <p className="text-xs text-jkd-text">
            {activeTab === 'principal'
              ? 'Use imagens 1:1 (1000x1000 - Feed) ou 9:16 (1080x1920 - Reels/History).'
              : 'Use imagens 16:9 (1920x1080 - Paisagem/Horizontal).'}
          </p>
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Search size={16} className="text-jkd-text" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome..."
                className="flex-1 input-style"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Tipo</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-style">
                <option value="todos">Todos</option>
                <option value="jpg">JPG</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg cursor-pointer hover:bg-jkd-border">
                <UploadCloud size={18} />
                <span>{uploading ? 'Enviando...' : 'Upload'}</span>
                <input type="file" accept="image/jpeg,image/png,image/svg+xml" className="hidden" onChange={handleUploadChange} disabled={uploading || !user} />
              </label>
              <button type="button" className="inline-flex items-center gap-2 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg hover:bg-jkd-border disabled:opacity-50" onClick={() => setIsUrlModalOpen(true)} disabled={uploading || !user}>
                <LinkIcon size={18} />
                <span>URL</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-jkd-text mt-2">Apenas imagens: JPEG, JPG, PNG, SVG. Máx 5MB.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded border border-red-300 bg-red-50 text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12">Carregando galeria...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((it) => (
              <div key={it.fullPath} className="border border-jkd-border rounded-lg overflow-hidden bg-jkd-bg-sec">
                <div className="aspect-square bg-white flex items-center justify-center">
                  <img src={it.url} alt={it.name} className="h-full w-full object-contain" />
                </div>
                <div className="p-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate" title={it.name}>{formatDisplayName(it.name)}</p>
                  </div>
                  <button className="p-1 rounded hover:bg-jkd-border" onClick={() => handleCopy(it.url)} title="Copiar URL">
                    <Copy size={16} />
                  </button>
                  <a className="p-1 rounded hover:bg-jkd-border" href={it.url} target="_blank" rel="noreferrer" title="Abrir em nova aba">
                    <ImageIcon size={16} />
                  </a>
                  <button className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-50" onClick={() => handleDelete(it)} title="Excluir imagem" disabled={!user}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-jkd-text">Nenhuma imagem encontrada.</div>
            )}
          </div>
        )}
        <InputPromptModal
          isOpen={isUrlModalOpen}
          title={activeTab === 'principal' ? 'Adicionar imagem por URL (Principal)' : 'Adicionar imagem por URL (Countdown)'}
          message={activeTab === 'principal' ? 'Informe a URL de uma imagem 1:1 ou 9:16.' : 'Informe a URL de uma imagem 16:9.'}
          inputLabel="URL da imagem"
          onConfirm={handleAddByUrl}
          onCancel={() => setIsUrlModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default GaleriaPage;