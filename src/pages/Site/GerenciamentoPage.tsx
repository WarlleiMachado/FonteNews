import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Save, Mic, Key, AlertCircle, Check, Users2, Youtube, Info, MessageCircle, Settings, Images, SlidersHorizontal, Edit3, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import { getMonthlyUsage, getMonthlyLimit, setMonthlyLimit, resetIfNewMonth } from '../../utils/voiceUsage';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import {
  resetIfNewMonth as ytResetIfNewMonth,
  getMonthlyUsage as ytGetMonthlyUsage,
  getMonthlyLimit as ytGetMonthlyLimit,
  setMonthlyLimit as ytSetMonthlyLimit,
  resetCurrentMonth as ytResetCurrentMonth,
} from '../../utils/youtubeLiveUsage';
import IntercessaoAdminPage from './IntercessaoAdminPage';
import { useToast } from '../../contexts/ToastContext';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, where, limit } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref as storageRef, uploadBytes, deleteObject } from 'firebase/storage';

const GerenciamentoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();
  const { config: maintenanceConfig, updateConfig: updateMaintenanceConfig, toggleMaintenance, toggleRedirect } = useMaintenance();
  const [sliderUrl, setSliderUrl] = useState(settings.sliderUrl || '');
  const [sliderHeight, setSliderHeight] = useState<number>(settings.sliderHeight || 500);
  const [sliderAutoRefreshMinutes, setSliderAutoRefreshMinutes] = useState<number>(settings.sliderAutoRefreshMinutes ?? 5);
  const [isSaving, setIsSaving] = useState(false);
  // Estados de versões bíblicas
  type BibleVersion = {
    id?: string;
    name: string;
    abbr: string;
    language?: string;
    active?: boolean;
    default?: boolean;
    storagePath?: string;
  };
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionName, setVersionName] = useState('');
  const [versionAbbr, setVersionAbbr] = useState('');
  const [versionLang, setVersionLang] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configurações de Voz (provedores e chaves API)
  const [voiceProvider, setVoiceProvider] = useState<string>('browser');
  const [googleApiKey, setGoogleApiKey] = useState<string>('');
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState<string>('');
  const [googleCharLimit, setGoogleCharLimit] = useState<number>(50000);
  const [elevenlabsCharLimit, setElevenlabsCharLimit] = useState<number>(10000);
  const [googleUsage, setGoogleUsage] = useState<number>(0);
  const [elevenlabsUsage, setElevenlabsUsage] = useState<number>(0);

  // Configurações YouTube Live
  const [ytEnabled, setYtEnabled] = useState<boolean>(settings.youtubeLive?.enabled ?? false);
  const [ytApiKey, setYtApiKey] = useState<string>(settings.youtubeLive?.apiKey || '');
  const [ytChannelId, setYtChannelId] = useState<string>(settings.youtubeLive?.channelId || '');
  const [ytCacheSec, setYtCacheSec] = useState<number>(settings.youtubeLive?.cacheSeconds ?? 60);
  const [ytBgAutoplayMuted, setYtBgAutoplayMuted] = useState<boolean>(settings.youtubeLive?.backgroundAutoplayMuted ?? true);
  const [ytBgOpacity, setYtBgOpacity] = useState<number>(settings.youtubeLive?.backgroundOpacity ?? 1);
  const [ytHideOnPopup, setYtHideOnPopup] = useState<boolean>(settings.youtubeLive?.hideBackgroundOnPopup ?? true);
  const [ytForceVideoId, setYtForceVideoId] = useState<string>(settings.youtubeLive?.forceVideoId || '');

  // Créditos da API YouTube
  const [ytMonthlyUsage, setYtMonthlyUsage] = useState<number>(0);
  const [ytMonthlyLimit, setYtMonthlyLimit] = useState<number>(0);

  useEffect(() => {
    try {
      resetIfNewMonth();
      const saved = localStorage.getItem('bibleVoiceSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.provider) setVoiceProvider(parsed.provider);
      }
      const gk = localStorage.getItem('bible-google-api-key') || '';
      const ek = localStorage.getItem('bible-elevenlabs-api-key') || '';
      setGoogleApiKey(gk);
      setElevenlabsApiKey(ek);
      // Limites e uso atuais
      setGoogleCharLimit(getMonthlyLimit('google'));
      setElevenlabsCharLimit(getMonthlyLimit('elevenlabs'));
      setGoogleUsage(getMonthlyUsage('google'));
      setElevenlabsUsage(getMonthlyUsage('elevenlabs'));
    } catch {}
  }, []);

  // Inicializar controle de uso YouTube Live
  useEffect(() => {
    ytResetIfNewMonth();
    setYtMonthlyUsage(ytGetMonthlyUsage());
    setYtMonthlyLimit(ytGetMonthlyLimit());
  }, []);

  const saveVoiceProvider = (p: 'browser' | 'system' | 'google' | 'elevenlabs') => {
    setVoiceProvider(p);
    try {
      const current = JSON.parse(localStorage.getItem('bibleVoiceSettings') || '{}');
      localStorage.setItem('bibleVoiceSettings', JSON.stringify({ ...current, provider: p }));
    } catch {
      localStorage.setItem('bibleVoiceSettings', JSON.stringify({ provider: p }));
    }
    showToast('success', 'Provedor de voz atualizado.');
  };

  const saveYouTubeSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        youtubeLive: {
          enabled: ytEnabled,
          apiKey: ytApiKey.trim(),
          channelId: ytChannelId.trim(),
          cacheSeconds: Math.max(10, Number(ytCacheSec) || 60),
          backgroundAutoplayMuted: ytBgAutoplayMuted,
          backgroundOpacity: Math.max(0, Math.min(1, Number(ytBgOpacity) || 1)),
          hideBackgroundOnPopup: ytHideOnPopup,
          forceVideoId: ytForceVideoId.trim(),
        },
      });
      ytResetIfNewMonth();
      setYtMonthlyUsage(ytGetMonthlyUsage());
      setYtMonthlyLimit(ytGetMonthlyLimit());
      showToast('success', 'Configurações do Fonte Live salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações do Fonte Live:', error);
      showToast('error', 'Erro ao salvar configurações do Fonte Live. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveYouTubeLimits = () => {
    try {
      ytSetMonthlyLimit(Math.max(0, Number(ytMonthlyLimit) || 0));
      setYtMonthlyUsage(ytGetMonthlyUsage());
      setYtMonthlyLimit(ytGetMonthlyLimit());
      showToast('success', 'Limite mensal do YouTube atualizado.');
    } catch {
      showToast('error', 'Falha ao salvar limite mensal do YouTube.');
    }
  };

  const resetYouTubeMonth = () => {
    try {
      ytResetCurrentMonth();
      setYtMonthlyUsage(ytGetMonthlyUsage());
      showToast('success', 'Uso mensal do YouTube reiniciado.');
    } catch {
      showToast('error', 'Não foi possível reiniciar o mês.');
    }
  };

  const saveLimits = () => {
    try {
      setMonthlyLimit('google', Math.max(0, Number(googleCharLimit) || 0));
      setMonthlyLimit('elevenlabs', Math.max(0, Number(elevenlabsCharLimit) || 0));
      setGoogleUsage(getMonthlyUsage('google'));
      setElevenlabsUsage(getMonthlyUsage('elevenlabs'));
      showToast('success', 'Limites de caracteres atualizados.');
    } catch {
      showToast('error', 'Falha ao salvar limites.');
    }
  };

  const saveApiKey = (provider: 'google' | 'elevenlabs', key: string) => {
    if (provider === 'google') {
      setGoogleApiKey(key);
      localStorage.setItem('bible-google-api-key', key);
    } else {
      setElevenlabsApiKey(key);
      localStorage.setItem('bible-elevenlabs-api-key', key);
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const handleSave = async () => {
    const url = (sliderUrl || '').trim();
    const height = Number(sliderHeight) || 500;
    const autoRefresh = Math.max(0, Number(sliderAutoRefreshMinutes) || 0);
    setIsSaving(true);
    try {
      await updateSettings({ sliderUrl: url, sliderHeight: height, sliderAutoRefreshMinutes: autoRefresh });
      showToast('success', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações do site:', error);
      showToast('error', 'Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Removido: todas as ações e estados relacionados à Bíblia/TTS
  async function loadVersions() {
    setLoadingVersions(true);
    try {
      const snap = await getDocs(collection(db, 'bibleVersions'));
      const list: BibleVersion[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
      setVersions(list);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar versões');
    } finally {
      setLoadingVersions(false);
    }
  }
  useEffect(() => { loadVersions(); }, []);

  async function handleAddVersion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!versionFile) {
      setError('Selecione o arquivo da versão bíblica (JSON).');
      return;
    }
    if (!versionName.trim() || !versionAbbr.trim()) {
      setError('Preencha Nome da Versão e Abreviação.');
      return;
    }
    setIsSubmitting(true);
    try {
      const safeAbbr = versionAbbr.trim().toUpperCase();
      const path = `bible/versions/${safeAbbr}.json`;
      const fileRef = storageRef(storage, path);
      // Valida que o arquivo é JSON e possui estrutura esperada
      const text = await versionFile.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('JSON inválido: estrutura não reconhecida');
        }
      } catch (parseErr: any) {
        throw new Error(`Falha ao ler JSON: ${parseErr?.message || 'erro desconhecido'}`);
      }

      // Define contentType explícito para Storage
      await uploadBytes(fileRef, new Blob([text], { type: 'application/json' }), { contentType: 'application/json' });

      // Evita duplicidade: atualiza se já existe versão com mesma abreviação
      const versionsCol = collection(db, 'bibleVersions');
      const snap = await getDocs(query(versionsCol, where('abbr', '==', safeAbbr), limit(1)));
      if (!snap.empty) {
        const ref = snap.docs[0].ref;
        await updateDoc(ref, {
          name: versionName.trim(),
          abbr: safeAbbr,
          language: versionLang.trim() || null,
          active: true,
          default: false,
          storagePath: path,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(versionsCol, {
          name: versionName.trim(),
          abbr: safeAbbr,
          language: versionLang.trim() || null,
          active: true,
          default: false,
          storagePath: path,
          createdAt: serverTimestamp(),
        });
      }
      setVersionFile(null);
      setVersionName('');
      setVersionAbbr('');
      setVersionLang('');
      showToast('success', 'Versão bíblica adicionada com sucesso!');
      await loadVersions();
    } catch (e: any) {
      console.error(e);
      const code = e?.code || '';
      if (code === 'storage/unauthorized') {
        setError('Sem permissão para enviar ao Storage. Verifique se sua conta é admin.');
      } else if (code === 'storage/canceled') {
        setError('Upload cancelado. Tente novamente.');
      } else if (code === 'storage/unknown') {
        setError('Erro desconhecido no upload. Verifique a conexão e tente novamente.');
      } else {
        setError(e?.message || 'Falha ao adicionar versão bíblica');
      }
      showToast('error', 'Falha ao adicionar versão bíblica');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function setActive(v: BibleVersion, active: boolean) {
    if (!v.id) return;
    await updateDoc(doc(db, 'bibleVersions', v.id), { active, updatedAt: serverTimestamp() });
    await loadVersions();
  }
  async function setDefault(v: BibleVersion) {
    if (!v.id) return;
    await Promise.all(versions.map(x => x.id ? updateDoc(doc(db, 'bibleVersions', x.id), { default: x.id === v.id, updatedAt: serverTimestamp() }) : Promise.resolve()));
    await loadVersions();
  }
  async function deleteVersion(v: BibleVersion) {
    if (!v.id) return;
    try {
      // Tentar remover arquivo no Storage se existir; tolerar objeto ausente
      if (v.storagePath) {
        try {
          await deleteObject(storageRef(storage, v.storagePath));
        } catch (err: any) {
          const code = err?.code || '';
          if (code === 'storage/object-not-found' || code === 'storage/invalid-root-operation') {
            // Ignorar se o arquivo não existe; prosseguir com exclusão do doc
            console.warn('Arquivo da versão não encontrado no Storage; continuando exclusão do documento.', err);
          } else {
            // Outros erros relevantes devem ser expostos
            throw err;
          }
        }
      }
      await deleteDoc(doc(db, 'bibleVersions', v.id));
      showToast('success', 'Versão bíblica excluída.');
      await loadVersions();
    } catch (e) {
      console.error('Erro ao excluir versão:', e);
      showToast('error', 'Falha ao excluir versão.');
    }
  }

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-jkd-heading">Gerenciamento</h1>
        <p className="text-jkd-text mt-2">Área administrativa do site (acesso restrito).</p>
        {/* Modo Manutenção — movido para o topo */}
        <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-red-900">Modo Manutenção</h2>
              <p className="text-sm text-red-700 mt-1">
                {maintenanceConfig.isActive 
                  ? '🔴 Site em manutenção. Apenas administradores podem acessar.' 
                  : '🟢 Site normal. Todos podem acessar.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={maintenanceConfig.isActive}
                onChange={() => {
                  console.log('[GerenciamentoPage] Toggle maintenance clicked');
                  console.log('[GerenciamentoPage] Current state:', maintenanceConfig.isActive);
                  toggleMaintenance();
                  console.log('[GerenciamentoPage] After toggle:', maintenanceConfig.isActive);
                }}
              />
              <div className={`toggle-container ${maintenanceConfig.isActive ? 'bg-red-600' : 'bg-gray-300'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:transition-all`}></div>
            </label>
          </div>

          {/* URL de Redirecionamento */}
          <div className="bg-white rounded-lg border border-red-100 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">URL de Redirecionamento</h3>
                <p className="text-sm text-gray-600">
                  {maintenanceConfig.useRedirect 
                    ? '🔄 Redirecionamento ativo. Usuários serão redirecionados.' 
                    : '📄 Conteúdo customizado ativo.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={maintenanceConfig.useRedirect}
                  onChange={toggleRedirect}
                />
                <div className={`toggle-container ${maintenanceConfig.useRedirect ? 'bg-blue-600' : 'bg-gray-300'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:transition-all`}></div>
              </label>
            </div>

            {maintenanceConfig.useRedirect && (
              <div>
                <label htmlFor="redirect-url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Redirecionamento
                </label>
                <input
                  id="redirect-url"
                  type="url"
                  value={maintenanceConfig.redirectUrl}
                  onChange={(e) => updateMaintenanceConfig({ redirectUrl: e.target.value })}
                  placeholder="https://exemplo.com/manutencao"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se houver uma URL aqui, os usuários serão redirecionados. Caso contrário, verão o conteúdo customizado.
                </p>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/site/maintenance/edit')}
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Edit3 size={18} />
              <span>Editar Modo Manutenção</span>
            </button>
            {maintenanceConfig.useRedirect && maintenanceConfig.redirectUrl && (
              <a
                href={maintenanceConfig.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink size={18} />
                <span>Testar Redirecionamento</span>
              </a>
            )}
          </div>

          {maintenanceConfig.isActive && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Atenção!</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                O modo manutenção está ativo. Usuários não administradores verão a página de manutenção ou serão redirecionados.
              </p>
            </div>
          )}
        </div>
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Configurações do Fonte News</h2>
          </div>
          <p className="text-sm text-jkd-text">Acesse e gerencie as configurações gerais do app principal.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/admin?tab=settings')}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
            >
              <Settings size={16} />
              <span>Abrir Configurações</span>
            </button>
          </div>
        </div>

        {/* Início – Configurações */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Início – Configurações</h2>
          </div>
          <p className="text-sm text-jkd-text">Defina imagem de fundo, opacidade e layout de colunas da Home.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/site/gerenciamento/inicio')}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
            >
              <Info size={16} />
              <span>Abrir Configurações da Home</span>
            </button>
          </div>
        </div>

        {/* Acesso às Configurações de Ministérios */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <Users2 className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Configuração de Ministérios</h2>
          </div>
          <p className="text-sm text-jkd-text">Gerencie os ministérios/departamentos: cadastrar, editar e excluir.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/site/gerenciamento/ministerios')}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
            >
              <Users2 size={16} />
              <span>Abrir Configuração de Ministérios</span>
            </button>
          </div>
        </div>

        {/* Líder-Chat — Aparência */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Líder-Chat — Aparência</h2>
          </div>
          <p className="text-sm text-jkd-text">Personalize cores das mensagens e imagem de fundo (overlay).</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/site/gerenciamento/lider-chat')}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
            >
              <MessageCircle size={16} />
              <span>Abrir Configurações do Líder-Chat</span>
            </button>
          </div>
        </div>


        {/* Culto-Blocos — Configurações */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Culto-Blocos — Configurações</h2>
          </div>
          <p className="text-sm text-jkd-text">Defina dias e imagens de cada bloco do contêiner na Home.</p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate('/site/gerenciamento/culto-blocos')}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
            >
              <Info size={16} />
              <span>Abrir Configurações de Culto-Blocos</span>
            </button>
          </div>
        </div>

        {/* Curso-Slide — Administração e Configurações */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <Images className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Curso-Slide — Administração</h2>
          </div>
          <p className="text-sm text-jkd-text">Crie, edite e ordene os slides exibidos na Home e na página de Cursos.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/site/gerenciamento/curso-slide')}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
            >
              <Images size={16} />
              <span>Abrir Administração de Curso-Slide</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/site/gerenciamento/curso-slide/config')}
              className="inline-flex items-center gap-2 bg-church-primary/10 text-church-primary px-4 py-2 rounded-lg hover:bg-church-primary/20 border border-church-primary/30"
            >
              <SlidersHorizontal size={16} />
              <span>Abrir Configurações de Curso-Slide</span>
            </button>
          </div>
        </div>

        {/* Adicionar Versão Bíblica */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div>
            <h2 className="text-xl font-semibold text-jkd-heading">Adicionar Versão Bíblica</h2>
            <p className="text-sm text-jkd-text mt-1">Faça upload de um arquivo JSON com a versão bíblica e cadastre os metadados.</p>
          </div>
          <form onSubmit={handleAddVersion} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-1">Arquivo da Versão Bíblica</label>
              <input type="file" accept="application/json" onChange={e=>setVersionFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Nome da Versão *</label>
                <input value={versionName} onChange={e=>setVersionName(e.target.value)} placeholder="Ex: Almeida Revista e Atualizada" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Abreviação *</label>
                <input value={versionAbbr} onChange={e=>setVersionAbbr(e.target.value)} placeholder="Ex: ARA" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-jkd-heading mb-1">Idioma</label>
                <input value={versionLang} onChange={e=>setVersionLang(e.target.value)} placeholder="Ex: pt-BR" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              </div>
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-church-primary text-white rounded-lg disabled:opacity-60">Selecionar Arquivo e Adicionar</button>
            </div>
          </form>
        </div>

        {/* Versões Disponíveis */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-4 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <h2 className="text-xl font-semibold text-jkd-heading">Versões Disponíveis</h2>
          {loadingVersions ? (
            <div className="text-jkd-text">Carregando versões...</div>
          ) : versions.length === 0 ? (
            <div className="text-jkd-text">Nenhuma versão cadastrada.</div>
          ) : (
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.id} className="flex items-center justify-between bg-jkd-bg rounded-lg border border-jkd-border p-3">
                  <div>
                    <div className="text-jkd-heading font-medium">{v.name} ({v.abbr})</div>
                    <div className="text-sm text-jkd-text">Idioma: {v.language || '—'} | Ativa: {v.active ? 'Sim' : 'Não'} | Padrão: {v.default ? 'Sim' : 'Não'}</div>
                    <div className="text-xs text-jkd-text mt-1">
                      Criada: {((v as any)?.createdAt?.toDate ? (v as any).createdAt.toDate().toLocaleString('pt-BR') : '—')}
                      {((v as any)?.updatedAt) ? ` | Atualizada: ${((v as any).updatedAt?.toDate ? (v as any).updatedAt.toDate().toLocaleString('pt-BR') : '—')}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>setActive(v, !v.active)} className="px-3 py-1 border border-jkd-border rounded-lg text-jkd-heading bg-jkd-bg">{v.active ? 'Desativar' : 'Ativar'}</button>
                    <button onClick={()=>setDefault(v)} className="px-3 py-1 border border-jkd-border rounded-lg text-jkd-heading bg-jkd-bg">Definir Padrão</button>
                    <button onClick={()=>deleteVersion(v)} className="px-3 py-1 bg-red-600 text-white rounded-lg">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configurações de Voz (clonado do rascunho) */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Configurações de Voz</h2>
          </div>

          {/* Seleção de Provedor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-jkd-heading mb-2">Provedor de Voz</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'browser', name: 'Vozes do Navegador', requiresApiKey: false },
                { id: 'system', name: 'Vozes do Sistema', requiresApiKey: false },
                { id: 'google', name: 'Google Text-to-Speech', requiresApiKey: true, apiKeySet: !!googleApiKey },
                { id: 'elevenlabs', name: 'ElevenLabs', requiresApiKey: true, apiKeySet: !!elevenlabsApiKey },
              ].map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => saveVoiceProvider(p.id)}
                  className={`p-4 text-left rounded-lg border-2 transition-colors ${
                    voiceProvider === p.id
                      ? 'border-church-primary/70 bg-church-primary/10'
                      : 'border-jkd-border hover:border-jkd-heading/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-jkd-heading">{p.name}</span>
                    {p.requiresApiKey && (
                      <div className={`w-3 h-3 rounded-full ${p.apiKeySet ? 'bg-green-500' : 'bg-red-500'}`} />
                    )}
                  </div>
                  <p className="text-sm text-jkd-text">
                    {p.id === 'browser' && 'Usa as vozes nativas do navegador'}
                    {p.id === 'system' && 'Usa as vozes instaladas no sistema'}
                    {p.id === 'google' && 'API do Google Cloud Text-to-Speech'}
                    {p.id === 'elevenlabs' && 'Vozes avançadas da ElevenLabs'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Chaves de API */}
          {voiceProvider === 'google' && (
            <div className="mb-6 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-blue-900">Google Cloud API Key</h3>
              </div>
              <input
                type="password"
                value={googleApiKey}
                onChange={(e) => saveApiKey('google', e.target.value)}
                placeholder="Cole sua chave da API do Google Cloud..."
                className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-jkd-bg text-jkd-text"
              />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-jkd-heading mb-2">Limite Mensal de Caracteres (Google)</label>
                  <input
                    type="number"
                    min={0}
                    value={googleCharLimit}
                    onChange={(e) => setGoogleCharLimit(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-jkd-bg text-jkd-text"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-sm text-jkd-text">Uso de Caracteres Neste Mês (Google)</span>
                  <span className={`text-sm font-medium ${googleUsage >= googleCharLimit ? 'text-red-600' : 'text-jkd-heading'}`}>{googleUsage.toLocaleString('pt-BR')} / {googleCharLimit.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">console.cloud.google.com → APIs & Services → Text-to-Speech API</p>
            </div>
          )}

          {voiceProvider === 'elevenlabs' && (
            <div className="mb-6 p-4 bg-green-50/50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-green-600" />
                <h3 className="font-medium text-green-900">ElevenLabs API Key</h3>
              </div>
              <input
                type="password"
                value={elevenlabsApiKey}
                onChange={(e) => saveApiKey('elevenlabs', e.target.value)}
                placeholder="Cole sua chave da API do ElevenLabs..."
                className="w-full px-3 py-2 border border-green-300 rounded-lg bg-jkd-bg text-jkd-text"
              />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-jkd-heading mb-2">Limite Mensal de Caracteres (ElevenLabs)</label>
                  <input
                    type="number"
                    min={0}
                    value={elevenlabsCharLimit}
                    onChange={(e) => setElevenlabsCharLimit(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg bg-jkd-bg text-jkd-text"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-sm text-jkd-text">Uso de Caracteres Neste Mês (ElevenLabs)</span>
                  <span className={`text-sm font-medium ${elevenlabsUsage >= elevenlabsCharLimit ? 'text-red-600' : 'text-jkd-heading'}`}>{elevenlabsUsage.toLocaleString('pt-BR')} / {elevenlabsCharLimit.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <p className="text-xs text-green-700 mt-2">elevenlabs.io → Profile → API Key</p>
            </div>
          )}

          {/* Status do Provedor */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg border ${
              (voiceProvider === 'browser' || voiceProvider === 'system') ||
              (voiceProvider === 'google' && googleApiKey) ||
              (voiceProvider === 'elevenlabs' && elevenlabsApiKey)
                ? 'border-green-200 bg-green-50'
                : 'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-center gap-2">
                {(voiceProvider === 'browser' || voiceProvider === 'system') ||
                 (voiceProvider === 'google' && googleApiKey) ||
                 (voiceProvider === 'elevenlabs' && elevenlabsApiKey) ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">Status da Configuração</span>
              </div>
              <p className="text-xs mt-1">
                {(voiceProvider === 'browser' || voiceProvider === 'system') ||
                 (voiceProvider === 'google' && googleApiKey) ||
                 (voiceProvider === 'elevenlabs' && elevenlabsApiKey)
                  ? 'Configurado e pronto para uso'
                  : 'API Key necessária para usar este provedor'}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-jkd-border">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-church-primary" />
                <span className="text-sm font-medium">Qualidade</span>
              </div>
              <p className="text-xs mt-1 text-jkd-text">
                {voiceProvider === 'browser' && 'Boa qualidade, offline'}
                {voiceProvider === 'system' && 'Boa qualidade, offline'}
                {voiceProvider === 'google' && 'Excelente qualidade, online'}
                {voiceProvider === 'elevenlabs' && 'Qualidade premium, online'}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={saveLimits}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
            >
              <Save size={16} />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </div>

        {/* Fonte Live — Configurações */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-jkd-heading">Fonte Live — Configurações</h2>
          </div>
          <p className="text-sm text-jkd-text">Gerencie chave da API, canal e comportamento do indicador ao vivo (Fonte Live). O status usa um ícone SVG animado na cor primária do App.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Habilitar Indicador</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setYtEnabled(true)} className={`px-3 py-2 rounded-lg border ${ytEnabled ? 'bg-green-100 border-green-300' : 'bg-jkd-bg border-jkd-border'}`}>Ligado</button>
                <button type="button" onClick={() => setYtEnabled(false)} className={`px-3 py-2 rounded-lg border ${!ytEnabled ? 'bg-red-100 border-red-300' : 'bg-jkd-bg border-jkd-border'}`}>Desligado</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">API Key (YouTube Data API v3)</label>
              <div className="flex gap-2">
                <input value={ytApiKey} onChange={(e)=>setYtApiKey(e.target.value)} placeholder="AIza..." className="flex-1 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
                <Key className="w-5 h-5 text-church-primary" />
              </div>
              <p className="text-xs text-jkd-text mt-1">Console Google → APIs & Services → Credentials</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Channel ID</label>
              <input value={ytChannelId} onChange={(e)=>setYtChannelId(e.target.value)} placeholder="UCxxxxxxxxxxxx" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              {ytChannelId && (
                <a href={`https://www.youtube.com/channel/${ytChannelId}`} target="_blank" rel="noreferrer" className="text-xs text-church-primary mt-1 inline-block">Abrir canal</a>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Cache (segundos)</label>
              <input type="number" min={10} value={ytCacheSec} onChange={(e)=>setYtCacheSec(Number(e.target.value))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              <p className="text-xs text-jkd-text mt-1">Poupa créditos da API com armazenamento local.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Vídeo de Fundo (autoplay e mudo)</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setYtBgAutoplayMuted(true)} className={`px-3 py-2 rounded-lg border ${ytBgAutoplayMuted ? 'bg-green-100 border-green-300' : 'bg-jkd-bg border-jkd-border'}`}>Ligado</button>
                <button type="button" onClick={() => setYtBgAutoplayMuted(false)} className={`px-3 py-2 rounded-lg border ${!ytBgAutoplayMuted ? 'bg-red-100 border-red-300' : 'bg-jkd-bg border-jkd-border'}`}>Desligado</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Transparência do Fundo</label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={1} step={0.01} value={ytBgOpacity} onChange={(e)=>setYtBgOpacity(Number(e.target.value))} className="w-full" />
                <span className="text-xs text-jkd-text">Atual: {Number(ytBgOpacity).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Ocultar Fundo ao Abrir Pop-up</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setYtHideOnPopup(true)} className={`px-3 py-2 rounded-lg border ${ytHideOnPopup ? 'bg-green-100 border-green-300' : 'bg-jkd-bg border-jkd-border'}`}>Sim</button>
                <button type="button" onClick={() => setYtHideOnPopup(false)} className={`px-3 py-2 rounded-lg border ${!ytHideOnPopup ? 'bg-red-100 border-red-300' : 'bg-jkd-bg border-jkd-border'}`}>Não</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-jkd-heading mb-2">Forçar Video ID (override)</label>
              <input value={ytForceVideoId} onChange={(e)=>setYtForceVideoId(e.target.value)} placeholder="Ex.: dQw4w9WgXcQ" className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              <p className="text-xs text-jkd-text mt-1">Opcional: se preencher (11 caracteres), o sistema tratará como Ao Vivo usando este ID, ignorando a detecção automática.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="p-4 rounded-lg border border-jkd-border bg-jkd-bg">
              <label className="block text-sm font-medium text-jkd-heading mb-2">Uso mensal (chamadas)</label>
              <p className="text-2xl font-semibold text-jkd-heading">{ytMonthlyUsage}</p>
              <p className="text-xs text-jkd-text mt-1 flex items-center gap-2"><Info size={14} /> Controlado localmente em `localStorage`.</p>
            </div>
            <div className="p-4 rounded-lg border border-jkd-border bg-jkd-bg">
              <label className="block text-sm font-medium text-jkd-heading mb-2">Limite mensal</label>
              <input type="number" value={ytMonthlyLimit} onChange={(e)=>setYtMonthlyLimit(Number(e.target.value))} className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text" />
              <p className="text-xs text-jkd-text mt-1">Apenas informativo/controle local.</p>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={resetYouTubeMonth} className="inline-flex items-center gap-2 bg-jkd-bg text-jkd-heading px-4 py-2 rounded-lg border border-jkd-border hover:bg-jkd-bg-sec">
                Reiniciar mês atual
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={saveYouTubeSettings}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-70"
            >
              <Save size={16} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Configurações de YouTube'}</span>
            </button>
            <button
              type="button"
              onClick={saveYouTubeLimits}
              className="inline-flex items-center gap-2 bg-jkd-bg text-jkd-heading px-4 py-2 rounded-lg border border-jkd-border hover:bg-jkd-bg-sec"
            >
              <Save size={16} />
              <span>Salvar Limite Mensal</span>
            </button>
          </div>
        </div>

        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div>
            <h2 className="text-xl font-semibold text-jkd-heading">Slider da Home (WordPress)</h2>
            <p className="text-sm text-jkd-text mt-1">Configure a página do WordPress que renderiza apenas o Revolution Slider, para ser embutida via iframe na Home do Site.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="slider-url" className="block text-sm font-medium text-jkd-heading mb-2">URL da Página do Slider (WP)</label>
              <input
                id="slider-url"
                type="url"
                placeholder="https://seusite.com/slider-home"
                value={sliderUrl}
                onChange={(e) => setSliderUrl(e.target.value)}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text placeholder-jkd-text/60 focus:outline-none focus:ring-2 focus:ring-church-primary"
              />
              <p className="text-xs text-jkd-text mt-2">A página WordPress deve permitir embed (CSP frame-ancestors) e conter somente o slider para melhor performance.</p>
            </div>
            <div>
              <label htmlFor="slider-height" className="block text-sm font-medium text-jkd-heading mb-2">Altura do iframe (px)</label>
              <input
                id="slider-height"
                type="number"
                min={300}
                max={1200}
                step={10}
                value={sliderHeight}
                onChange={(e) => setSliderHeight(Number(e.target.value) || 500)}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text placeholder-jkd-text/60 focus:outline-none focus:ring-2 focus:ring-church-primary"
              />
              <p className="text-xs text-jkd-text mt-2">Altura opcional. Por padrão, usamos alturas responsivas por breakpoint: &gt;1024 → 900px; 1023–778 → 768px; 777–480 → 960px; &lt;480 → 720px.</p>
            </div>
            <div>
              <label htmlFor="slider-auto-refresh" className="block text-sm font-medium text-jkd-heading mb-2">Auto-atualizar (min)</label>
              <input
                id="slider-auto-refresh"
                type="number"
                min={0}
                max={120}
                step={1}
                value={sliderAutoRefreshMinutes}
                onChange={(e) => setSliderAutoRefreshMinutes(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text placeholder-jkd-text/60 focus:outline-none focus:ring-2 focus:ring-church-primary"
              />
              <p className="text-xs text-jkd-text mt-2">Quando maior que 0, anexamos um parâmetro ao iframe que muda a cada N minutos, evitando cache e refletindo alterações do WordPress automaticamente.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-70"
            >
              <Save size={16} />
              <span>{isSaving ? 'Salvando...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </div>

        {/* Rolagem por botões do Slider (WP) */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-4 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <h2 className="text-xl font-semibold text-jkd-heading">Rolagem por Botões do Slider (WP)</h2>
          <p className="text-sm text-jkd-text">Defina âncoras e a origem do iframe para permitir que botões do Slider rolem a página até seções da Home.</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/site/gerenciamento/anchors')}
              className="inline-flex items-center gap-2 bg-jkd-bg text-jkd-heading px-4 py-2 rounded-lg border border-jkd-border hover:bg-jkd-bg-sec"
            >
              <span>Abrir Configuração de Âncoras</span>
            </button>
          </div>
        </div>


        {/* Seções de Bíblia e TTS removidas conforme solicitado */}

        {/* Fonte Add — Formulários dinâmicos */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Fonte Add — Formulários</h2>
          </div>
          <p className="text-sm text-jkd-text">Crie e gerencie formulários dinâmicos para voluntários, membros, ministérios, cursos e líderes.</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/site/fonte-add')}
              className="inline-flex items-center gap-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90"
            >
              <span>Abrir Fonte Add</span>
            </button>
          </div>
        </div>

        {/* Intercessão — Configurações */}
        <div className="mt-6 bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 transition-colors hover:border-church-primary focus-within:border-church-primary">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-church-primary" />
            <h2 className="text-xl font-semibold text-jkd-heading">Intercessão — Configurações</h2>
          </div>
          <p className="text-sm text-jkd-text">Configurações do mural de oração centralizadas no Gerenciamento.</p>
          <div className="mt-4">
            <IntercessaoAdminPage embed />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerenciamentoPage;
