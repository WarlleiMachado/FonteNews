import React, { useRef, useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { VideoNewsSettings } from '../../types';
import { ToggleLeft, ToggleRight, Youtube, Link, UploadCloud, Save } from 'lucide-react';
import { uploadVideoNews } from '../../services/uploadService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';

const VideoNewsTab: React.FC<{ onSave: () => void }> = ({ onSave }) => {
  const { settings, updateSettings } = useApp();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [localSettings, setLocalSettings] = useState<VideoNewsSettings>(settings.videoNewsSettings);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleInputChange = (field: keyof VideoNewsSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateSettings({ videoNewsSettings: localSettings });
    onSave();
  };

  return (
    <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
      <div className="p-6 border-b border-jkd-border">
        <h2 className="text-lg font-semibold text-jkd-heading">Gerenciamento do Vídeo News</h2>
        <p className="text-sm text-jkd-text">Configure o vídeo que aparecerá no popup da página inicial.</p>
      </div>
      <div className="p-6 space-y-6">
        
        <div className="flex items-center justify-between p-4 bg-jkd-bg border border-jkd-border rounded-lg">
            <span className="font-medium text-jkd-text">Habilitar Vídeo na Home</span>
            <button type="button" onClick={() => handleInputChange('enabled', !localSettings.enabled)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${localSettings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {localSettings.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {localSettings.enabled ? 'Ativado' : 'Desativado'}
            </button>
        </div>

        <div className="space-y-4">
            <h3 className="font-medium text-jkd-heading">Fonte do Vídeo</h3>
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => handleInputChange('sourceType', 'youtube')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${localSettings.sourceType === 'youtube' ? 'bg-church-primary text-white' : 'bg-jkd-bg border border-jkd-border'}`}>
                    <Youtube size={16} /> YouTube
                </button>
                <button type="button" onClick={() => handleInputChange('sourceType', 'url')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${localSettings.sourceType === 'url' ? 'bg-church-primary text-white' : 'bg-jkd-bg border border-jkd-border'}`}>
                    <Link size={16} /> URL Direta
                </button>
            </div>
        </div>

        <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium text-jkd-heading mb-1">URL do Vídeo</label>
            <input 
                type="url" 
                id="videoUrl" 
                value={localSettings.url} 
                onChange={e => handleInputChange('url', e.target.value)} 
                className="w-full input-style"
                placeholder={localSettings.sourceType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://servidor.com/video.mp4'}
                required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-jkd-heading mb-1">Upload (MP4, MOV)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.mov,video/mp4,video/quicktime"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploading(true);
                  const url = await uploadVideoNews(file);
                  setLocalSettings(prev => ({ ...prev, sourceType: 'url', url }));
                } catch (err: any) {
                  showToast('error', err?.message || 'Falha no upload do vídeo.');
                } finally {
                  setUploading(false);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || (user?.role !== 'admin')}
              title={user?.role !== 'admin' ? 'Apenas administradores podem enviar vídeos' : uploading ? 'Enviando...' : ''}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-jkd-border rounded-lg bg-jkd-bg text-jkd-text disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <UploadCloud size={20} />
                <span>{uploading ? 'Enviando...' : 'Fazer upload de vídeo'}</span>
            </button>
            <p className="text-xs text-jkd-text/70 mt-1">Use arquivos MP4 ou MOV. Após o envio, a URL gerada será preenchida automaticamente na opção "URL Direta" acima.</p>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-jkd-border">
          <button 
            onClick={handleSave}
            className="inline-flex items-center space-x-2 bg-church-primary text-white px-6 py-2 rounded-lg hover:bg-church-primary/90"
          >
            <Save size={16} />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </div>
      <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
    </div>
  );
};

export default VideoNewsTab;
