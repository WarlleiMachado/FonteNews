import React, { useEffect, useMemo, useState } from 'react';
import { X, Copy, Search } from 'lucide-react';
import { listGalleryImages, GalleryItem } from '../../services/galleryService';
import { useToast } from '../../contexts/ToastContext';

interface GalleryLightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (url: string) => void;
  initialTab?: 'principal' | 'countdown';
}

const GalleryLightModal: React.FC<GalleryLightModalProps> = ({ isOpen, onClose, onInsert, initialTab = 'principal' }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'principal' | 'countdown'>(initialTab);

  useEffect(() => {
    if (!isOpen) return;
    const run = async () => {
      setLoading(true);
      try {
        const list = await listGalleryImages(activeTab);
        setItems(list);
      } catch (err) {
        console.error('Erro ao carregar galeria (light):', err);
        showToast('error', 'Falha ao carregar a galeria.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isOpen, activeTab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(it => !q || it.name.toLowerCase().includes(q));
  }, [items, query]);

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast('success', 'URL copiada!');
    } catch {
      showToast('error', 'Não foi possível copiar a URL.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-jkd-bg-sec border border-jkd-border rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-jkd-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-jkd-text" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome..."
              className="input-style"
            />
          </div>
          <button className="p-2 rounded hover:bg-jkd-border" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 pt-3 flex-shrink-0">
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
          <p className="text-xs text-jkd-text mb-2">
            {activeTab === 'principal'
              ? 'Use imagens 1:1 (1000x1000 - Feed) ou 9:16 (1080x1920 - Reels/History).'
              : 'Use imagens 16:9 (1920x1080 - Paisagem/Horizontal).'}
          </p>
        </div>
        <div className="p-4 overflow-auto flex-1 min-h-0">
          {loading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(it => (
                <div key={it.fullPath} className="border border-jkd-border rounded-lg overflow-hidden bg-white">
                  <div className="aspect-square flex items-center justify-center">
                    <img src={it.url} alt={it.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="p-2 flex items-center gap-2">
                    <p className="text-xs truncate flex-1" title={it.name}>{it.name}</p>
                    <button className="p-1 rounded hover:bg-jkd-border" onClick={() => handleCopy(it.url)} title="Copiar">
                      <Copy size={16} />
                    </button>
                    {onInsert && (
                      <button className="px-2 py-1 rounded bg-church-primary text-white text-xs" onClick={() => onInsert(it.url)}>Inserir</button>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-jkd-text">Nenhuma imagem encontrada.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryLightModal;