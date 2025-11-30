import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Upload, Save, Image as ImageIcon, Palette, Type } from 'lucide-react';
import { storage } from '../../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const LeaderChatConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();

  const initial = settings.leaderChatAppearance || {};
  const [messageSentBgColorHex, setMessageSentBgColorHex] = useState<string>(initial.messageSentBgColorHex || '#DCF8C6');
  const [messageReceivedBgColorHex, setMessageReceivedBgColorHex] = useState<string>(initial.messageReceivedBgColorHex || '#FFFFFF');
  const [messageSentTextColorHex, setMessageSentTextColorHex] = useState<string>(initial.messageSentTextColorHex || '#000000');
  const [messageReceivedTextColorHex, setMessageReceivedTextColorHex] = useState<string>(initial.messageReceivedTextColorHex || '#000000');

  const [overlayImageSource, setOverlayImageSource] = useState<'url' | 'upload'>(initial.overlayImageSource || 'url');
  const [overlayImageUrl, setOverlayImageUrl] = useState<string>(initial.overlayImageUrl || '');
  const [overlayImageUploadUrl, setOverlayImageUploadUrl] = useState<string>(initial.overlayImageUploadUrl || '');
  const [overlayUploadFile, setOverlayUploadFile] = useState<File | null>(null);
  const [overlayRepeat, setOverlayRepeat] = useState<boolean>(initial.overlayRepeat ?? false);
  const [overlaySize, setOverlaySize] = useState<'auto' | 'cover' | 'contain'>(initial.overlaySize || 'cover');
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'center' | 'bottom'>(initial.overlayPosition || 'center');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(typeof initial.overlayOpacity === 'number' ? initial.overlayOpacity : 0.2);

  useEffect(() => {
    // Keep local state in sync if settings change elsewhere
    const s = settings.leaderChatAppearance || {};
    setMessageSentBgColorHex(s.messageSentBgColorHex || '#DCF8C6');
    setMessageReceivedBgColorHex(s.messageReceivedBgColorHex || '#FFFFFF');
    setMessageSentTextColorHex(s.messageSentTextColorHex || '#000000');
    setMessageReceivedTextColorHex(s.messageReceivedTextColorHex || '#000000');
    setOverlayImageSource(s.overlayImageSource || 'url');
    setOverlayImageUrl(s.overlayImageUrl || '');
    setOverlayImageUploadUrl(s.overlayImageUploadUrl || '');
    setOverlayRepeat(s.overlayRepeat ?? false);
    setOverlaySize(s.overlaySize || 'cover');
    setOverlayPosition(s.overlayPosition || 'center');
    setOverlayOpacity(typeof s.overlayOpacity === 'number' ? s.overlayOpacity : 0.2);
  }, [settings.leaderChatAppearance]);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const handleUploadOverlay = async () => {
    if (!overlayUploadFile) return;
    try {
      const path = `leader-chat/overlay/${Date.now()}_${overlayUploadFile.name}`;
      const ref = storageRef(storage, path);
      const snapshot = await uploadBytes(ref, overlayUploadFile);
      const url = await getDownloadURL(snapshot.ref);
      setOverlayImageUploadUrl(url);
      setOverlayImageSource('upload');
      showToast('success', 'Imagem enviada com sucesso!');
    } catch (err) {
      console.error('Falha no upload:', err);
      showToast('error', 'Falha ao enviar imagem.');
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        leaderChatAppearance: {
          messageSentBgColorHex,
          messageReceivedBgColorHex,
          messageSentTextColorHex,
          messageReceivedTextColorHex,
          overlayImageSource,
          overlayImageUrl: overlayImageSource === 'url' ? overlayImageUrl.trim() : '',
          overlayImageUploadUrl: overlayImageSource === 'upload' ? overlayImageUploadUrl : '',
          overlayRepeat,
          overlaySize,
          overlayPosition,
          overlayOpacity: Math.max(0, Math.min(1, Number(overlayOpacity) || 0)),
        },
      });
      showToast('success', 'Configurações do Líder-Chat salvas com sucesso!');
      navigate('/site/gerenciamento');
    } catch (err) {
      console.error('Erro ao salvar aparência do chat:', err);
      showToast('error', 'Erro ao salvar configurações.');
    }
  };

  const previewOverlayUrl = overlayImageSource === 'upload' ? overlayImageUploadUrl : overlayImageUrl;

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-jkd-heading">Líder-Chat — Aparência</h1>
        <p className="text-jkd-text mt-2">Personalize cores das mensagens e a imagem de fundo da área de conversa.</p>

        {/* Cores das mensagens */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Cores das Mensagens</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-jkd-heading">Fundo — Enviadas</label>
              <input type="color" value={messageSentBgColorHex} onChange={(e)=>setMessageSentBgColorHex(e.target.value)} className="w-20 h-10 p-0 border border-jkd-border rounded" />
              <label className="block text-sm font-medium text-jkd-heading">Fonte — Enviadas</label>
              <input type="color" value={messageSentTextColorHex} onChange={(e)=>setMessageSentTextColorHex(e.target.value)} className="w-20 h-10 p-0 border border-jkd-border rounded" />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-jkd-heading">Fundo — Recebidas</label>
              <input type="color" value={messageReceivedBgColorHex} onChange={(e)=>setMessageReceivedBgColorHex(e.target.value)} className="w-20 h-10 p-0 border border-jkd-border rounded" />
              <label className="block text-sm font-medium text-jkd-heading">Fonte — Recebidas</label>
              <input type="color" value={messageReceivedTextColorHex} onChange={(e)=>setMessageReceivedTextColorHex(e.target.value)} className="w-20 h-10 p-0 border border-jkd-border rounded" />
            </div>
          </div>

          {/* Preview simples */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded border border-jkd-border" style={{ background: messageReceivedBgColorHex, color: messageReceivedTextColorHex }}>
              <div className="text-xs text-jkd-text">Exemplo — Recebida</div>
              <div className="mt-2">Mensagem recebida com estas cores.</div>
            </div>
            <div className="p-4 rounded border border-jkd-border" style={{ background: messageSentBgColorHex, color: messageSentTextColorHex }}>
              <div className="text-xs text-jkd-text">Exemplo — Enviada</div>
              <div className="mt-2">Mensagem enviada com estas cores.</div>
            </div>
          </div>
        </div>

        {/* Imagem de sobreposição */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Imagem de Sobreposição</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Fonte da Imagem</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={overlayImageSource==='url'} onChange={()=>setOverlayImageSource('url')} />
                    <span>URL</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" checked={overlayImageSource==='upload'} onChange={()=>setOverlayImageSource('upload')} />
                    <span>Upload</span>
                  </label>
                </div>
              </div>

              {overlayImageSource === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-jkd-heading mb-1">URL da Imagem</label>
                  <input type="text" value={overlayImageUrl} onChange={(e)=>setOverlayImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-jkd-border rounded bg-jkd-bg text-jkd-text" />
                </div>
              )}

              {overlayImageSource === 'upload' && (
                <div>
                  <label className="block text-sm font-medium text-jkd-heading mb-1">Upload de Imagem</label>
                  <input type="file" accept="image/*" onChange={(e)=>setOverlayUploadFile(e.target.files?.[0] || null)} className="w-full" />
                  <button type="button" onClick={handleUploadOverlay} className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded bg-church-primary text-white hover:bg-church-primary/90">
                    <Upload size={16} /> Enviar Imagem
                  </button>
                  {overlayImageUploadUrl && (
                    <div className="mt-2 text-xs text-jkd-text">Imagem enviada. URL: {overlayImageUploadUrl.slice(0,60)}...</div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-jkd-heading mb-1">Tamanho</label>
                  <select value={overlaySize} onChange={(e)=>setOverlaySize(e.target.value as any)} className="w-full px-3 py-2 border border-jkd-border rounded bg-jkd-bg text-jkd-text">
                    <option value="auto">Auto</option>
                    <option value="cover">Cobrir</option>
                    <option value="contain">Conter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-jkd-heading mb-1">Posição</label>
                  <select value={overlayPosition} onChange={(e)=>setOverlayPosition(e.target.value as any)} className="w-full px-3 py-2 border border-jkd-border rounded bg-jkd-bg text-jkd-text">
                    <option value="top">Topo</option>
                    <option value="center">Centro</option>
                    <option value="bottom">Base</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div className="flex items-center gap-2">
                  <input id="repeat" type="checkbox" checked={overlayRepeat} onChange={(e)=>setOverlayRepeat(e.target.checked)} />
                  <label htmlFor="repeat" className="text-sm text-jkd-heading">Repetir imagem</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-jkd-heading mb-1">Opacidade</label>
                  <input type="range" min={0} max={1} step={0.01} value={overlayOpacity} onChange={(e)=>setOverlayOpacity(Number(e.target.value))} className="w-full" />
                  <div className="text-xs text-jkd-text">{overlayOpacity.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="rounded border border-jkd-border p-4">
              <div className="text-sm text-jkd-text mb-2">Pré-visualização</div>
              <div className="relative h-64 rounded overflow-hidden border border-jkd-border bg-jkd-bg">
                {previewOverlayUrl && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${previewOverlayUrl})`,
                      backgroundRepeat: overlayRepeat ? 'repeat' : 'no-repeat',
                      backgroundSize: overlaySize,
                      backgroundPosition: overlayPosition,
                      opacity: overlayOpacity,
                    }}
                  />
                )}
                <div className="relative z-10 p-3 space-y-3">
                  <div className="inline-block px-3 py-2 rounded" style={{ background: messageReceivedBgColorHex, color: messageReceivedTextColorHex }}>Mensagem recebida</div>
                  <div className="inline-block px-3 py-2 rounded" style={{ background: messageSentBgColorHex, color: messageSentTextColorHex }}>Mensagem enviada</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={()=>navigate('/site/gerenciamento')} className="px-4 py-2 rounded-lg bg-jkd-bg text-jkd-heading border border-jkd-border">Voltar</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded-lg bg-church-primary text-white inline-flex items-center gap-2">
            <Save size={16} /> Salvar Aparência
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderChatConfigPage;