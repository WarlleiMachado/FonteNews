import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import InputPromptModal from '../../components/Common/InputPromptModal';
import PrayerForm from '../../components/PedidoDeOracao/PrayerForm';
import PrayerFilters from '../../components/PedidoDeOracao/PrayerFilters';
import PrayerCards from '../../components/PedidoDeOracao/PrayerCards';
import PrayerPopup from '../../components/PedidoDeOracao/PrayerPopup';
import { ShieldAlert } from 'lucide-react';
import PedidoIcon from '../../components/Common/PedidoIcon';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PrayerSettings } from '../../types';

const PedidoDeOracaoPage: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [isPwdModalOpen, setPwdModalOpen] = useState(false);
  const [unlockedAdmin, setUnlockedAdmin] = useState(false);
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);
  const [settings, setSettings] = useState<PrayerSettings | null>(null);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);
  const [pwdModalMessage, setPwdModalMessage] = useState<string>('Informe a senha para acessar INTERCESSÃO (Painel).');
  const [viewMode, setViewMode] = useState<'public' | 'mine'>('public');
  const [pendingPrivateId, setPendingPrivateId] = useState<string | null>(null);

  const handleClickPainel = () => {
    if (!isAdmin) return;
    if (unlockedAdmin) {
      navigate('/site/pedido-de-oracao/painel');
      return;
    }
    setTargetRoute('/site/pedido-de-oracao/painel');
    setPwdModalMessage('Informe a senha para acessar INTERCESSÃO (Painel).');
    setPwdModalOpen(true);
  };

  // Removido: acesso direto a Configurações via página de pedidos. Configurações agora no menu Gerenciamento.

  const handleConfirmPwd = (pwd: string) => {
    const isPainelTarget = targetRoute === '/site/pedido-de-oracao/painel';
    const painelOk = pwd === '*FdVL2016#'; // senha da Área Restrita INTERCESSÃO (inalterada)
    const privateOk = pwd === '#PrEduardo*'; // senha para abrir pedido privado
    if (isPainelTarget && painelOk) {
      setUnlockedAdmin(true);
      setPwdModalOpen(false);
      if (targetRoute) navigate(targetRoute);
      return;
    }
    if (pendingPrivateId && privateOk) {
      setPwdModalOpen(false);
      const ev = new CustomEvent('prayers:open', { detail: { id: pendingPrivateId, mode: 'public' } });
      window.dispatchEvent(ev);
      setPendingPrivateId(null);
    }
  };

  useEffect(() => { (async () => {
    try {
      const snap = await getDoc(doc(db, 'prayer_settings', 'default'));
      if (snap.exists()) setSettings(snap.data() as PrayerSettings);
    } catch {}
  })(); }, []);

  useEffect(() => {
    const handler = (e: any) => {
      if (!isAdmin) return;
      const id = e?.detail?.id as string | undefined;
      if (!id) return;
      setPendingPrivateId(id);
      setPwdModalMessage('Informe a senha para acessar o pedido privado.');
      setPwdModalOpen(true);
    };
    window.addEventListener('prayers:open:private:password', handler);
    return () => window.removeEventListener('prayers:open:private:password', handler);
  }, [isAdmin]);

  const bgStyle = useMemo(() => {
    const s = settings;
    const pluginUrl = '/mural-de-oracao/assets/images/placeholders/default-prayer.jpg';
    const chosenUrl = s?.bgImageSource === 'upload' ? s?.bgImageUploadUrl : s?.bgImageUrl;
    const url = s?.bgImageSource === 'plugin' ? pluginUrl : chosenUrl || pluginUrl;
    if (!url) return {} as React.CSSProperties;
    const position = s?.bgPosition === 'top' ? 'top center' : s?.bgPosition === 'bottom' ? 'bottom center' : 'center center';
    return {
      backgroundImage: `url(${url})`,
      backgroundRepeat: s?.bgRepeat ? 'repeat' : 'no-repeat',
      backgroundSize: s?.bgSize || 'cover',
      backgroundPosition: position,
      opacity: Math.min(Math.max(s?.bgOpacity ?? 0.35, 0), 1),
    } as React.CSSProperties;
  }, [settings]);

  useEffect(() => {
    try {
      console.log('[PedidoDeOracaoPage] mount', { path: window.location?.pathname, at: new Date().toISOString() });
    } catch {}
    return () => {
      try {
        console.log('[PedidoDeOracaoPage] unmount', { path: window.location?.pathname, at: new Date().toISOString() });
      } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-jkd-bg py-6" onContextMenu={(e)=>{ e.preventDefault(); }}>
      <div className="absolute inset-0 z-0 pointer-events-none" style={bgStyle} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-jkd-heading flex items-center gap-2">
            <PedidoIcon className="h-16 w-16 text-church-primary" />
            Pedido de Oração
          </h1>
          <p className="text-jkd-text mt-1">Envie seu pedido, ore por outros e compartilhe.</p>

          <div className="mt-3 flex justify-end gap-2">
            {((user || firebaseUser || auth.currentUser)) && (
              <button
                type="button"
                onClick={() => navigate('/site/pedido-de-oracao/meus')}
                className="group flex flex-col items-end bg-church-primary/10 hover:bg-church-primary/20 text-church-primary border border-church-primary/30 rounded-lg px-3 py-2"
                aria-label="Meus Pedidos"
              >
                <span className="text-xs text-jkd-text">Acesso Pessoal</span>
                <span className="text-sm font-semibold tracking-wide flex items-center gap-1">
                  Meus Pedidos
                </span>
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={handleClickPainel}
                className="group flex flex-col items-end bg-church-primary/10 hover:bg-church-primary/20 text-church-primary border border-church-primary/30 rounded-lg px-3 py-2"
                aria-label="Painel de Pedidos"
              >
                <span className="text-xs text-jkd-text">Área Restrita</span>
                <span className="text-sm font-semibold tracking-wide flex items-center gap-1">
                  <PedidoIcon className="h-4 w-4" /> INTERCESSÃO
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <PrayerForm />
          </div>
          <div className="lg:col-span-2">
            <div className="relative bg-jkd-bg-sec rounded-lg border border-jkd-border p-3">
              <div className="absolute inset-0 rounded-lg bg-church-primary/10 pointer-events-none" />
              <h2 className="text-lg font-semibold text-jkd-heading">Corrente de Oração</h2>
              <p className="text-sm text-jkd-text">Ore por um pedido</p>
            </div>
            <PrayerFilters />
            <div className="mt-4">
              <PrayerCards mode={'public'} />
            </div>
          </div>
        </div>
      </div>

      <PrayerPopup />

      <InputPromptModal
        isOpen={isPwdModalOpen}
        title="Acesso Restrito"
        message={pwdModalMessage}
        inputLabel="Senha"
        onConfirm={handleConfirmPwd}
        onCancel={() => { setPwdModalOpen(false); setTargetRoute(null); }}
      />
    </div>
  );
};

export default PedidoDeOracaoPage;