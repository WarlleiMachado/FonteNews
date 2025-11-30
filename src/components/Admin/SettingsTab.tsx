import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { TickerSettings } from '../../types';
import { Image, Palette, Info, Copyright, RotateCcw, Newspaper, ToggleLeft, ToggleRight, ArrowRight, ArrowLeft, Save, ImagePlus, UploadCloud, X, Volume2, Play } from 'lucide-react';
import { uploadImage, uploadAudio } from '../../services/uploadService';
import { defaultChatBeepUrl, defaultApprovalsBeepUrl, defaultRequestsBeepUrl, defaultProgramStartBeepUrl } from '../../utils/sounds';

const SettingsTab: React.FC<{ onSave: () => void }> = ({ onSave }) => {
  const { settings, updateSettings } = useApp();
  const [localSettings, setLocalSettings] = useState(settings);
  const [parallaxFile, setParallaxFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAwarenessUploading, setIsAwarenessUploading] = useState(false);
  const [isAudioUploading, setIsAudioUploading] = useState(false);
  const [highlightUrlInput, setHighlightUrlInput] = useState('');
  const AWARENESS_DEFAULT = { text: '', imageSource: 'url' as const, imageUrl: '', imageUploadUrl: '', priorityEnabled: false };

  const handleInputChange = (field: keyof typeof localSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };
  
  const handleNestedChange = (parent: keyof typeof settings, field: string, value: any) => {
    const newParentState = { ...localSettings[parent] as object, [field]: value };
    setLocalSettings(prev => ({ ...prev, [parent]: newParentState }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onSave();
  };

  const DEFAULT_PRIMARY_COLOR = '#6f83a5';

  const handleParallaxFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setParallaxFile(file);
    try {
      setIsUploading(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `images/destaque-news/${Date.now()}-${safeName}`;
      const url = await uploadImage(file, path);
      const current = Array.isArray(localSettings.newsHighlightImages) ? localSettings.newsHighlightImages : [];
      setLocalSettings(prev => ({ ...prev, newsHighlightImages: [...current, url] }));
    } catch (err) {
      console.error('Erro no upload da imagem de destaque:', err);
    } finally {
      setIsUploading(false);
      setParallaxFile(null);
      // limpa o input para permitir reupload do mesmo arquivo
      try { e.target.value = ''; } catch {}
    }
  };

  const handleAwarenessFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    try {
      setIsAwarenessUploading(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `images/awareness/${Date.now()}-${safeName}`;
      const url = await uploadImage(file, path);
      setLocalSettings(prev => ({
        ...prev,
        awarenessCalendar: {
          ...(prev.awarenessCalendar || AWARENESS_DEFAULT),
          imageUploadUrl: url,
          imageSource: 'upload'
        }
      }));
    } catch (err) {
      console.error('Erro no upload da imagem de conscientização:', err);
    } finally {
      setIsAwarenessUploading(false);
      try { e.target.value = ''; } catch {}
    }
  };

  const handleAudioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'audioAlertChatUrl' | 'audioAlertApprovalsUrl' | 'audioAlertRequestsUrl' | 'programStartAudioUrl',
    pathPrefix: string
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    try {
      setIsAudioUploading(true);
      const url = await uploadAudio(file, pathPrefix);
      const nameField =
        field === 'audioAlertChatUrl' ? 'audioAlertChatName' :
        field === 'audioAlertApprovalsUrl' ? 'audioAlertApprovalsName' :
        field === 'audioAlertRequestsUrl' ? 'audioAlertRequestsName' :
        'programStartAudioName';
      setLocalSettings(prev => ({ ...prev, [field]: url, [nameField]: file.name } as any));
      await updateSettings({ [field]: url, [nameField]: file.name } as any);
      onSave();
    } catch (err) {
      console.error('Erro no upload de áudio:', err);
    } finally {
      setIsAudioUploading(false);
      try { e.target.value = ''; } catch {}
    }
  };

  return (
    <>
      <style>{`
        .slider-volume {
          background: linear-gradient(to right, #10b981 0%, #10b981 var(--value, 0%), #e5e7eb var(--value, 0%), #e5e7eb 100%);
        }
        .slider-volume::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider-volume::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
      <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-8">
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-jkd-heading">Identidade Visual</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="churchName" className="block text-sm font-medium text-jkd-text mb-2">Nome da Igreja (Subtítulo da Home)</label>
            <input type="text" id="churchName" value={localSettings.churchName} onChange={e => handleInputChange('churchName', e.target.value)} className="input-style w-full" />
          </div>
          <div>
            <label htmlFor="logoUrl" className="block text-sm font-medium text-jkd-text mb-2"><div className="flex items-center gap-2"><Image size={16} /> URL do Logo (Cabeçalho)</div></label>
            <input type="url" id="logoUrl" value={localSettings.logoUrl} onChange={e => handleInputChange('logoUrl', e.target.value)} className="input-style w-full" />
          </div>
        </div>
        
        <div>
          <label htmlFor="primaryColor" className="block text-sm font-medium text-jkd-text mb-2"><div className="flex items-center gap-2"><Palette size={16} /> Cor Principal</div></label>
          <div className="flex items-center gap-2">
            <input type="color" value={localSettings.primaryColor} onChange={e => handleInputChange('primaryColor', e.target.value)} className="h-10 w-12 rounded-lg border border-jkd-border cursor-pointer bg-transparent p-0" />
            <input type="text" value={localSettings.primaryColor} onChange={e => handleInputChange('primaryColor', e.target.value)} className="input-style w-full" />
            <button type="button" onClick={() => handleInputChange('primaryColor', DEFAULT_PRIMARY_COLOR)} className="p-2.5 rounded-lg bg-jkd-bg border border-jkd-border" title="Restaurar cor padrão">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-jkd-text mb-2">Gradiente do título "Fonte News"</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings(prev => ({ ...prev, titleGradient: { ...(prev.titleGradient || { enabled: false, from: '#c084fc', via: '#ec4899', to: '#ef4444', durationSec: 6 }), enabled: !(prev.titleGradient?.enabled) } }))}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${localSettings.titleGradient?.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
              >
                {localSettings.titleGradient?.enabled ? 'Ativado' : 'Desativado'}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-jkd-text min-w-[40px]">From</span>
                <input type="color" value={localSettings.titleGradient?.from || '#c084fc'} onChange={e => setLocalSettings(prev => ({ ...prev, titleGradient: { ...(prev.titleGradient || { enabled: false, from: '#c084fc', via: '#ec4899', to: '#ef4444', durationSec: 6 }), from: e.target.value } }))} className="h-9 w-9 rounded border border-jkd-border" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-jkd-text min-w-[40px]">Via</span>
                <input type="color" value={localSettings.titleGradient?.via || '#ec4899'} onChange={e => setLocalSettings(prev => ({ ...prev, titleGradient: { ...(prev.titleGradient || { enabled: false, from: '#c084fc', via: '#ec4899', to: '#ef4444', durationSec: 6 }), via: e.target.value } }))} className="h-9 w-9 rounded border border-jkd-border" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-jkd-text min-w-[40px]">To</span>
                <input type="color" value={localSettings.titleGradient?.to || '#ef4444'} onChange={e => setLocalSettings(prev => ({ ...prev, titleGradient: { ...(prev.titleGradient || { enabled: false, from: '#c084fc', via: '#ec4899', to: '#ef4444', durationSec: 6 }), to: e.target.value } }))} className="h-9 w-9 rounded border border-jkd-border" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-jkd-text mb-1">Duração (s)</label>
                <input type="number" min={2} max={120} value={localSettings.titleGradient?.durationSec || 6} onChange={e => setLocalSettings(prev => ({ ...prev, titleGradient: { ...(prev.titleGradient || { enabled: false, from: '#c084fc', via: '#ec4899', to: '#ef4444', durationSec: 6 }), durationSec: Number(e.target.value) || 6 } }))} className="input-style w-full" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-jkd-text mb-1">Preview</label>
                <div
                  className="text-2xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(to right, ${localSettings.titleGradient?.from || '#c084fc'}, ${localSettings.titleGradient?.via || '#ec4899'}, ${localSettings.titleGradient?.to || '#ef4444'})`, backgroundSize: '200% 200%' }}
                >
                  Fonte News
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-jkd-heading"><span className="flex items-center gap-2"><Newspaper size={20} /> Faixa de Notícias (Ticker)</span></h3>
        <div className="space-y-4 p-4 bg-jkd-bg border border-jkd-border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">Habilitar Faixa</span>
            <button type="button" onClick={() => handleNestedChange('tickerSettings', 'enabled', !localSettings.tickerSettings.enabled)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${localSettings.tickerSettings.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {localSettings.tickerSettings.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {localSettings.tickerSettings.enabled ? 'Ativada' : 'Desativada'}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <span className="font-medium">Direção</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleNestedChange('tickerSettings', 'direction', 'left')} className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${localSettings.tickerSettings.direction === 'left' ? 'bg-church-primary text-white' : 'bg-jkd-border'}`}><ArrowLeft size={16}/> Esquerda</button>
              <button type="button" onClick={() => handleNestedChange('tickerSettings', 'direction', 'right')} className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${localSettings.tickerSettings.direction === 'right' ? 'bg-church-primary text-white' : 'bg-jkd-border'}`}><ArrowRight size={16}/> Direita</button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="tickerSpeed" className="font-medium flex items-center gap-2">
                <Volume2 size={16} />
                Velocidade
              </label>
              <div className="flex items-center gap-2 text-sm bg-jkd-border px-3 py-1 rounded-md">
                <span className="font-mono">{localSettings.tickerSettings.speed}</span>
                <span className="text-jkd-text/70">
                  ({(() => {
                    const speed = Math.max(1, Math.min(100, localSettings.tickerSettings.speed));
                    const minDuration = 3;
                    const maxDuration = 60;
                    const logMin = Math.log(minDuration);
                    const logMax = Math.log(maxDuration);
                    const scale = (logMax - logMin) / 99;
                    const logDuration = logMax - (speed - 1) * scale;
                    const duration = Math.round(Math.exp(logDuration) * 10) / 10;
                    return `${duration}s`;
                  })()})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-jkd-text/70 min-w-[40px]">Lento</span>
              <div className="flex-1 relative">
                <input 
                  id="tickerSpeed" 
                  type="range" 
                  min="1" 
                  max="100" 
                  step="1" 
                  value={localSettings.tickerSettings.speed} 
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    handleNestedChange('tickerSettings', 'speed', value);
                    // Atualizar progresso visual
                    const slider = e.target as HTMLInputElement;
                    const percentage = ((value - 1) / 99) * 100;
                    slider.style.setProperty('--value', `${percentage}%`);
                  }} 
                  className="w-full h-3 bg-jkd-border rounded-lg appearance-none cursor-pointer accent-church-primary slider-volume" 
                  style={{'--value': `${((localSettings.tickerSettings.speed - 1) / 99) * 100}%`} as React.CSSProperties}
                />
                <div className="absolute top-0 left-0 h-3 bg-church-primary/20 rounded-lg pointer-events-none" style={{width: `${localSettings.tickerSettings.speed}%`}}></div>
              </div>
              <span className="text-xs text-jkd-text/70 min-w-[40px] text-right">Rápido</span>
            </div>
            <div className="flex justify-between text-xs text-jkd-text/50">
              <span>60s</span>
              <span>12s</span>
              <span>3s</span>
            </div>
          </div>
          {/* Presets de velocidade */}
          <div className="flex flex-col gap-3">
            <span className="font-medium">Predefinições Precisas</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Muito Lento', value: 10, duration: '45s', desc: 'Leitura pausada' },
                { label: 'Lento', value: 25, duration: '24s', desc: 'Leitura confortável' },
                { label: 'Normal', value: 50, duration: '12s', desc: 'Velocidade padrão' },
                { label: 'Rápido', value: 75, duration: '6s', desc: 'Dinâmico' },
                { label: 'Muito Rápido', value: 90, duration: '4s', desc: 'Urgente' },
              ].map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleNestedChange('tickerSettings', 'speed', p.value)}
                  className={`p-3 rounded-lg text-sm border-2 transition-all ${
                    localSettings.tickerSettings.speed === p.value 
                      ? 'bg-church-primary text-white border-church-primary' 
                      : 'bg-jkd-background border-jkd-border hover:border-church-primary/50'
                  }`}
                  title={`${p.label}: ${p.duration} por ciclo`}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs opacity-70">{p.duration}</div>
                  <div className="text-xs opacity-50">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pausas de início e reinício */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <label htmlFor="tickerStartDelay" className="font-medium">Pausa no início (s)</label>
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <span className="text-xs">0</span>
                <input
                  id="tickerStartDelay"
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={localSettings.tickerSettings.startDelaySec ?? 0}
                  onChange={(e) => handleNestedChange('tickerSettings', 'startDelaySec', Number(e.target.value))}
                  className="w-full h-2 bg-jkd-border rounded-lg appearance-none cursor-pointer accent-church-primary"
                />
                <span className="text-xs">10</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={localSettings.tickerSettings.startDelaySec ?? 0}
                  onChange={(e) => handleNestedChange('tickerSettings', 'startDelaySec', Number(e.target.value))}
                  className="input-style w-24"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <label htmlFor="tickerRestartDelay" className="font-medium">Pausa no reinício (s)</label>
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <span className="text-xs">0</span>
                <input
                  id="tickerRestartDelay"
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={localSettings.tickerSettings.restartDelaySec ?? 0}
                  onChange={(e) => handleNestedChange('tickerSettings', 'restartDelaySec', Number(e.target.value))}
                  className="w-full h-2 bg-jkd-border rounded-lg appearance-none cursor-pointer accent-church-primary"
                />
                <span className="text-xs">10</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  step={0.5}
                  value={localSettings.tickerSettings.restartDelaySec ?? 0}
                  onChange={(e) => handleNestedChange('tickerSettings', 'restartDelaySec', Number(e.target.value))}
                  className="input-style w-24"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <span className="font-medium">Conteúdo</span>
            <div className="flex items-center gap-2">
              {(['week', 'month', 'year'] as TickerSettings['scope'][]).map(scope => (
                <button key={scope} type="button" onClick={() => handleNestedChange('tickerSettings', 'scope', scope)} className={`px-3 py-1 rounded-md text-sm ${localSettings.tickerSettings.scope === scope ? 'bg-church-primary text-white' : 'bg-jkd-border'}`}>
                  {scope === 'week' ? 'Semana' : scope === 'month' ? 'Mês' : 'Ano'}
                </button>
              ))}
            </div>
          </div>

          {/* Calendário de Conscientização */}
          <div className="mt-4 space-y-3">
            <h4 className="text-lg font-semibold text-jkd-heading">🎗️ Calendário de Conscientização</h4>
            <p className="text-sm text-jkd-text">Exibe um texto e um logo mensal (PNG transparente 1:1) em toda a Faixa de Notícias. Quando a prioridade está ligada, aparece antes do conteúdo normal.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-jkd-text mb-2">Texto da campanha</label>
                <input
                  type="text"
                  value={(localSettings.awarenessCalendar?.text) || ''}
                  onChange={e => setLocalSettings(prev => ({
                    ...prev,
                    awarenessCalendar: { ...(prev.awarenessCalendar || AWARENESS_DEFAULT), text: e.target.value }
                  }))}
                  className="input-style w-full"
                  placeholder="Ex.: Outubro Rosa — Prevenção e Cuidado"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Prioridade sobre conteúdo normal</span>
                <button
                  type="button"
                  onClick={() => setLocalSettings(prev => ({
                    ...prev,
                    awarenessCalendar: { ...(prev.awarenessCalendar || AWARENESS_DEFAULT), priorityEnabled: !(prev.awarenessCalendar?.priorityEnabled) }
                  }))}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${localSettings.awarenessCalendar?.priorityEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  {localSettings.awarenessCalendar?.priorityEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {localSettings.awarenessCalendar?.priorityEnabled ? 'Ligada' : 'Desligada'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <span className="font-medium">Imagem do mês</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocalSettings(prev => ({ ...prev, awarenessCalendar: { ...(prev.awarenessCalendar || AWARENESS_DEFAULT), imageSource: 'url' } }))}
                  className={`px-3 py-1 rounded-md text-sm ${ (localSettings.awarenessCalendar?.imageSource || 'url') === 'url' ? 'bg-church-primary text-white' : 'bg-jkd-border' }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setLocalSettings(prev => ({ ...prev, awarenessCalendar: { ...(prev.awarenessCalendar || AWARENESS_DEFAULT), imageSource: 'upload' } }))}
                  className={`px-3 py-1 rounded-md text-sm ${ (localSettings.awarenessCalendar?.imageSource || 'url') === 'upload' ? 'bg-church-primary text-white' : 'bg-jkd-border' }`}
                >
                  Upload PNG 1:1
                </button>
              </div>

              { (localSettings.awarenessCalendar?.imageSource || 'url') === 'url' ? (
                <div>
                  <label className="block text-sm font-medium text-jkd-text mb-2">URL da imagem (PNG transparente 1:1)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      value={(localSettings.awarenessCalendar?.imageUrl) || ''}
                      onChange={e => setLocalSettings(prev => ({
                        ...prev,
                        awarenessCalendar: { ...(prev.awarenessCalendar || AWARENESS_DEFAULT), imageUrl: e.target.value, imageUploadUrl: '' }
                      }))}
                      className="input-style w-full"
                      placeholder="https://exemplo.com/logo-mes.png"
                    />
                    { (localSettings.awarenessCalendar?.imageUrl) && (
                      <button
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, awarenessCalendar: { ...(prev.awarenessCalendar || AWARENESS_DEFAULT), imageUrl: '' } }))}
                        className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-sm"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="awareness-upload" className={`relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-6 flex justify-center items-center text-center transition-colors hover:border-church-primary/50`}>
                    <div className="space-y-1 text-jkd-text">
                      <UploadCloud className="mx-auto h-10 w-10" />
                      <span className="font-medium text-church-primary">Clique para enviar</span>
                      <p className="text-xs">PNG transparente 1:1 até 5MB</p>
                    </div>
                    <input id="awareness-upload" name="awareness-upload" type="file" className="sr-only" onChange={handleAwarenessFileChange} accept="image/png,image/*" />
                  </label>
                  {isAwarenessUploading && <p className="text-xs text-jkd-text mt-2">Enviando imagem...</p>}
                  {(localSettings.awarenessCalendar?.imageUploadUrl) && (
                    <div className="mt-3 flex items-center gap-3">
                      <img src={localSettings.awarenessCalendar.imageUploadUrl} alt="Logo do mês" className="h-12 w-12 object-contain rounded border border-jkd-border bg-white" />
                      <button
                        type="button"
                        onClick={() => setLocalSettings(prev => ({ ...prev, awarenessCalendar: { ...(prev.awarenessCalendar || AWARENESS_DEFAULT), imageUploadUrl: '' } }))}
                        className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-jkd-heading"><div className="flex items-center gap-2"><ImagePlus size={20} /> Destaque News</div></h3>
        <div className="p-4 bg-jkd-bg border border-jkd-border rounded-lg space-y-4">
          <div>
            <label htmlFor="highlight-url" className="block text-sm font-medium text-jkd-text mb-2">Adicionar imagem por URL</label>
            <div className="flex gap-2 items-center">
              <input id="highlight-url" type="url" value={highlightUrlInput} onChange={e => setHighlightUrlInput(e.target.value)} className="input-style w-full" placeholder="https://exemplo.com/imagem.jpg" />
              <button type="button" onClick={() => {
                const url = highlightUrlInput.trim();
                if (!url) return;
                const current = Array.isArray(localSettings.newsHighlightImages) ? localSettings.newsHighlightImages : [];
                setLocalSettings(prev => ({ ...prev, newsHighlightImages: [...current, url] }));
                setHighlightUrlInput('');
              }} className="px-3 py-2 rounded-lg bg-church-primary text-white text-sm">Adicionar</button>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="flex-grow border-t border-jkd-border"></div>
            <span className="flex-shrink mx-4 text-jkd-text text-sm">ou</span>
            <div className="flex-grow border-t border-jkd-border"></div>
          </div>
          <div>
            <label htmlFor="highlight-upload" className={`relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-6 flex justify-center items-center text-center transition-colors hover:border-church-primary/50`}>
              <div className="space-y-1 text-jkd-text">
                <UploadCloud className="mx-auto h-10 w-10" />
                <span className="font-medium text-church-primary">Clique para enviar</span>
                <p className="text-xs">PNG, JPG até 5MB</p>
              </div>
              <input id="highlight-upload" name="highlight-upload" type="file" className="sr-only" onChange={handleParallaxFileChange} accept="image/*" />
            </label>
            {isUploading && <p className="text-xs text-jkd-text mt-2">Enviando imagem...</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Imagens cadastradas</span>
              <button type="button" onClick={() => setLocalSettings(prev => ({ ...prev, newsHighlightImages: [] }))} className="text-sm text-red-500 hover:bg-red-500/10 px-3 py-1 rounded-lg">Remover todas</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(localSettings.newsHighlightImages || []).map((img, idx) => (
                <div key={`${img}-${idx}`} className="relative group border border-jkd-border rounded-lg overflow-hidden">
                  <img src={img} alt={`Destaque ${idx+1}`} className="w-full h-24 object-cover" />
                  <button type="button" title="Remover" onClick={() => {
                    const next = (localSettings.newsHighlightImages || []).filter((_, i) => i !== idx);
                    setLocalSettings(prev => ({ ...prev, newsHighlightImages: next }));
                  }} className="absolute top-2 right-2 p-1.5 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {(localSettings.newsHighlightImages || []).length === 0 && (
                <p className="text-sm text-jkd-text col-span-full">Nenhuma imagem cadastrada. O fundo padrão será usado.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Efeito de transição</label>
              <select value={(localSettings.newsHighlightOptions?.effect) || 'fade'} onChange={e => {
                const effect = e.target.value as 'fade' | 'slide';
                const base = localSettings.newsHighlightOptions || { effect: 'fade', durationSec: 10 };
                setLocalSettings(prev => ({ ...prev, newsHighlightOptions: { ...base, effect } }));
              }} className="input-style w-full">
                <option value="fade">Desvanecer (Fade)</option>
                <option value="slide">Deslizar (Slide)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Duração por imagem (segundos)</label>
              <input type="number" min={2} max={120} value={(localSettings.newsHighlightOptions?.durationSec) || 10} onChange={e => {
                const durationSec = Number(e.target.value) || 10;
                const base = localSettings.newsHighlightOptions || { effect: 'fade', durationSec: 10 };
                setLocalSettings(prev => ({ ...prev, newsHighlightOptions: { ...base, durationSec } }));
              }} className="input-style w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-jkd-heading"><div className="flex items-center gap-2"><Info size={20} /> Informações de Contato (Secretaria)</div></h3>
        <div className="space-y-4">
          <input type="email" placeholder="Email da secretaria" value={localSettings.contactInfo.email} onChange={e => handleNestedChange('contactInfo', 'email', e.target.value)} className="input-style w-full" />
          <input type="tel" placeholder="Telefone da secretaria" value={localSettings.contactInfo.phone} onChange={e => handleNestedChange('contactInfo', 'phone', e.target.value)} className="input-style w-full" />
          <input type="text" placeholder="Endereço" value={localSettings.contactInfo.address} onChange={e => handleNestedChange('contactInfo', 'address', e.target.value)} className="input-style w-full" />
          <input type="text" placeholder="Horário dos cultos" value={localSettings.contactInfo.services} onChange={e => handleNestedChange('contactInfo', 'services', e.target.value)} className="input-style w-full" />
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-jkd-heading"><div className="flex items-center gap-2"><Copyright size={20} /> Rodapé</div></h3>
        <div>
          <label htmlFor="copyrightText" className="block text-sm font-medium text-jkd-text mb-2">Texto do Copyright</label>
          <input type="text" id="copyrightText" value={localSettings.copyrightText} onChange={e => handleInputChange('copyrightText', e.target.value)} className="input-style w-full" />
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-jkd-heading"><div className="flex items-center gap-2"><Image size={20} /> Countdown: Overlay (Fade Cíclico)</div></h3>
        <div className="p-4 bg-jkd-bg border border-jkd-border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Habilitar efeito de overlay</span>
            <button
              type="button"
              onClick={() => handleInputChange('countdownOverlayEnabled', !localSettings.countdownOverlayEnabled)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${localSettings.countdownOverlayEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
              {localSettings.countdownOverlayEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {localSettings.countdownOverlayEnabled ? 'Ativado' : 'Desativado'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Tempo visível (segundos)</label>
              <input
                type="number"
                min={5}
                max={600}
                value={(localSettings.countdownOverlayCycle?.visibleSec) ?? 30}
                onChange={e => handleNestedChange('countdownOverlayCycle' as any, 'visibleSec', Number(e.target.value) || 30)}
                className="input-style w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Tempo oculto (segundos)</label>
              <input
                type="number"
                min={5}
                max={600}
                value={(localSettings.countdownOverlayCycle?.hiddenSec) ?? 15}
                onChange={e => handleNestedChange('countdownOverlayCycle' as any, 'hiddenSec', Number(e.target.value) || 15)}
                className="input-style w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Fade-in (segundos)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={(localSettings.countdownOverlayCycle?.fadeInSec) ?? 5}
                onChange={e => handleNestedChange('countdownOverlayCycle' as any, 'fadeInSec', Number(e.target.value) || 5)}
                className="input-style w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Fade-out (segundos)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={(localSettings.countdownOverlayCycle?.fadeOutSec) ?? 5}
                onChange={e => handleNestedChange('countdownOverlayCycle' as any, 'fadeOutSec', Number(e.target.value) || 5)}
                className="input-style w-full"
              />
            </div>
          </div>
          <p className="text-xs text-jkd-text">Aplica-se a qualquer novo countdown. Quando ativado, a imagem overlay alterna com fade-in/out e ciclos de exibição/ocultação conforme configurado.</p>
        </div>
      </div>

      {/* Alertas Sonoros */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-jkd-heading"><span className="flex items-center gap-2"><Volume2 size={20} /> Alertas Sonoros</span></h3>
        <div className="p-4 bg-jkd-bg border border-jkd-border rounded-lg space-y-4">
          <p className="text-sm text-jkd-text">Defina sons (MP3) para novos eventos. O alerta repete a cada 15s até ser visualizado. O áudio de início de programação dura 30s.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Conversa no Chat (MP3)</label>
              <label htmlFor="audio-chat-upload" className="relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-4 flex justify-center items-center text-center transition-colors hover:border-church-primary/50">
                <div className="space-y-1 text-jkd-text">
                  <UploadCloud className="mx-auto h-8 w-8" />
                  <span className="font-medium text-church-primary">Clique para enviar</span>
                  <p className="text-xs">MP3 até 20MB</p>
                </div>
                <input id="audio-chat-upload" type="file" className="sr-only" accept="audio/mpeg,audio/mp3" onChange={(e) => handleAudioUpload(e, 'audioAlertChatUrl', 'audio/chat')} />
              </label>
              {localSettings.audioAlertChatUrl ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <audio controls src={localSettings.audioAlertChatUrl} className="w-full" />
                    <button type="button" onClick={() => setLocalSettings(prev => ({ ...prev, audioAlertChatUrl: '', audioAlertChatName: '' }))} className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-sm">Remover</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-jkd-text">Arquivo: {localSettings.audioAlertChatName || 'Sem nome'}</span>
                    <button type="button" onClick={() => { try { const a = new Audio(localSettings.audioAlertChatUrl!); a.currentTime = 0; a.play(); } catch (err) {} }} className="px-3 py-2 rounded-lg bg-church-primary/10 text-church-primary text-sm flex items-center gap-1">
                      <Play size={14} /> Testar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-jkd-text">Usando som padrão</span>
                  <button type="button" onClick={() => { try { const url = defaultChatBeepUrl(); const a = new Audio(url); a.currentTime = 0; a.play(); if (url.startsWith('blob:')) a.addEventListener('ended', () => URL.revokeObjectURL(url)); } catch (err) {} }} className="px-3 py-2 rounded-lg bg-church-primary/10 text-church-primary text-sm flex items-center gap-1">
                    <Play size={14} /> Testar
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Aprovações (MP3)</label>
              <label htmlFor="audio-approvals-upload" className="relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-4 flex justify-center items-center text-center transition-colors hover:border-church-primary/50">
                <div className="space-y-1 text-jkd-text">
                  <UploadCloud className="mx-auto h-8 w-8" />
                  <span className="font-medium text-church-primary">Clique para enviar</span>
                  <p className="text-xs">MP3 até 20MB</p>
                </div>
                <input id="audio-approvals-upload" type="file" className="sr-only" accept="audio/mpeg,audio/mp3" onChange={(e) => handleAudioUpload(e, 'audioAlertApprovalsUrl', 'audio/approvals')} />
              </label>
              {localSettings.audioAlertApprovalsUrl ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <audio controls src={localSettings.audioAlertApprovalsUrl} className="w-full" />
                    <button type="button" onClick={() => setLocalSettings(prev => ({ ...prev, audioAlertApprovalsUrl: '', audioAlertApprovalsName: '' }))} className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-sm">Remover</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-jkd-text">Arquivo: {localSettings.audioAlertApprovalsName || 'Sem nome'}</span>
                    <button type="button" onClick={() => { try { const a = new Audio(localSettings.audioAlertApprovalsUrl!); a.currentTime = 0; a.play(); } catch (err) {} }} className="px-3 py-2 rounded-lg bg-church-primary/10 text-church-primary text-sm flex items-center gap-1">
                      <Play size={14} /> Testar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-jkd-text">Usando som padrão</span>
                  <button type="button" onClick={() => { try { const url = defaultApprovalsBeepUrl(); const a = new Audio(url); a.currentTime = 0; a.play(); if (url.startsWith('blob:')) a.addEventListener('ended', () => URL.revokeObjectURL(url)); } catch (err) {} }} className="px-3 py-2 rounded-lg bg-church-primary/10 text-church-primary text-sm flex items-center gap-1">
                    <Play size={14} /> Testar
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Solicitações (MP3)</label>
              <label htmlFor="audio-requests-upload" className="relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-4 flex justify-center items-center text-center transition-colors hover:border-church-primary/50">
                <div className="space-y-1 text-jkd-text">
                  <UploadCloud className="mx-auto h-8 w-8" />
                  <span className="font-medium text-church-primary">Clique para enviar</span>
                  <p className="text-xs">MP3 até 20MB</p>
                </div>
                <input id="audio-requests-upload" type="file" className="sr-only" accept="audio/mpeg,audio/mp3" onChange={(e) => handleAudioUpload(e, 'audioAlertRequestsUrl', 'audio/requests')} />
              </label>
              {localSettings.audioAlertRequestsUrl ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <audio controls src={localSettings.audioAlertRequestsUrl} className="w-full" />
                    <button type="button" onClick={() => setLocalSettings(prev => ({ ...prev, audioAlertRequestsUrl: '', audioAlertRequestsName: '' }))} className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-sm">Remover</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-jkd-text">Arquivo: {localSettings.audioAlertRequestsName || 'Sem nome'}</span>
                    <button type="button" onClick={() => { try { const a = new Audio(localSettings.audioAlertRequestsUrl!); a.currentTime = 0; a.play(); } catch (err) {} }} className="px-3 py-2 rounded-lg bg-church-primary/10 text-church-primary text-sm flex items-center gap-1">
                      <Play size={14} /> Testar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-jkd-text">Usando som padrão</span>
                  <button type="button" onClick={() => { try { const url = defaultRequestsBeepUrl(); const a = new Audio(url); a.currentTime = 0; a.play(); if (url.startsWith('blob:')) a.addEventListener('ended', () => URL.revokeObjectURL(url)); } catch (err) {} }} className="px-3 py-2 rounded-lg bg-church-primary/10 text-church-primary text-sm flex items-center gap-1">
                    <Play size={14} /> Testar
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-jkd-text mb-2">Início de Programação (MP3)</label>
              <label htmlFor="audio-program-start-upload" className="relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-4 flex justify-center items-center text-center transition-colors hover:border-church-primary/50">
                <div className="space-y-1 text-jkd-text">
                  <UploadCloud className="mx-auto h-8 w-8" />
                  <span className="font-medium text-church-primary">Clique para enviar</span>
                  <p className="text-xs">MP3 até 20MB</p>
                </div>
                <input id="audio-program-start-upload" type="file" className="sr-only" accept="audio/mpeg,audio/mp3" onChange={(e) => handleAudioUpload(e, 'programStartAudioUrl', 'audio/program-start')} />
              </label>
              {localSettings.programStartAudioUrl ? (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <audio controls src={localSettings.programStartAudioUrl} className="w-full" />
                    <button type="button" onClick={() => setLocalSettings(prev => ({ ...prev, programStartAudioUrl: '', programStartAudioName: '' }))} className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-sm">Remover</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-jkd-text">Arquivo: {localSettings.programStartAudioName || 'Sem nome'}</span>
                    <button type="button" onClick={() => { try { const a = new Audio(localSettings.programStartAudioUrl!); a.currentTime = 0; a.play(); } catch (err) {} }} className="px-3 py-2 rounded-lg bg-church-primary/10 text-church-primary text-sm flex items-center gap-1">
                      <Play size={14} /> Testar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-jkd-text">Usando som padrão</span>
                  <button type="button" onClick={() => { try { const url = defaultProgramStartBeepUrl(); const a = new Audio(url); a.currentTime = 0; a.play(); if (url.startsWith('blob:')) a.addEventListener('ended', () => URL.revokeObjectURL(url)); } catch (err) {} }} className="px-3 py-2 rounded-lg bg-church-primary/10 text-church-primary text-sm flex items-center gap-1">
                    <Play size={14} /> Testar
                  </button>
                </div>
              )}
              <div className="mt-3">
                <label className="inline-flex items-center gap-2 text-sm text-jkd-text">
                  <input
                    type="checkbox"
                    checked={!!localSettings.programStartAudioMuted}
                    onChange={(e) => handleInputChange('programStartAudioMuted', e.target.checked)}
                    className="rounded border-jkd-border"
                  />
                  Mutar áudio de início de programação
                </label>
              </div>
            </div>
          </div>
          {isAudioUploading && <p className="text-xs text-jkd-text mt-2">Enviando áudio...</p>}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-jkd-border">
        <button onClick={handleSave} className="inline-flex items-center space-x-2 bg-church-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-church-primary/90 transition-all">
          <Save size={18} />
          <span>Salvar Todas as Alterações</span>
        </button>
      </div>
      </div>
    </>
  );
};

export default SettingsTab;
