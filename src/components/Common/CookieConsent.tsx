import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

type CookiePreferences = {
  necessary: boolean;
  performance: boolean;
  marketing: boolean;
  savedAt: string;
};

const STORAGE_KEY = 'cookie_consent_preferences';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({ necessary: true, performance: false, marketing: false, savedAt: '' });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Já há consentimento salvo
        setVisible(false);
      } else {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  // Permite reabrir o banner via evento global ou limpar e reabrir
  useEffect(() => {
    const openHandler = () => setVisible(true);
    const clearAndOpenHandler = () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setVisible(true);
    };
    window.addEventListener('open-cookie-consent', openHandler);
    window.addEventListener('clear-cookie-consent', clearAndOpenHandler);
    return () => {
      window.removeEventListener('open-cookie-consent', openHandler);
      window.removeEventListener('clear-cookie-consent', clearAndOpenHandler);
    };
  }, []);

  const savePreferences = (next: CookiePreferences) => {
    const payload = { ...next, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
    setVisible(false);
  };

  const acceptAll = () => {
    savePreferences({ necessary: true, performance: true, marketing: true, savedAt: '' });
  };

  const rejectAll = () => {
    savePreferences({ necessary: true, performance: false, marketing: false, savedAt: '' });
  };

  const saveCustom = () => {
    savePreferences(prefs);
  };

  if (!visible) return null;

  return (
    <div className="fixed left-4 right-4 z-50 safe-bottom-4">
      <div className="relative bg-jkd-bg-sec border-2 border-church-primary rounded-xl shadow-lg p-4 sm:p-5 text-jkd-text">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 p-1 rounded-full text-jkd-text/60 hover:bg-jkd-border hover:text-jkd-text transition-colors"
          aria-label="Fechar e decidir depois"
          title="Fechar e decidir depois"
        >
          <X size={18} />
        </button>
        <div className="flex items-start gap-3">
          <div className="text-2xl" aria-hidden>🍪</div>
          <div className="flex-1 space-y-2">
            <h2 className="text-jkd-heading font-semibold">Política de Cookies</h2>
            <p className="text-sm">
              Usamos cookies necessários para funcionamento e, opcionalmente, cookies de desempenho e marketing para melhorar sua experiência.
              Você pode aceitar, recusar ou configurar suas preferências.
            </p>
            <p className="text-xs">
              Saiba mais em nossa <Link to="/cookies" className="text-church-primary hover:underline">Política de Cookies</Link> e em nossa
              {' '}<Link to="/privacy" className="text-church-primary hover:underline">Política de Privacidade</Link>.
            </p>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-jkd-border bg-jkd-bg">
              <p className="font-medium text-jkd-heading">Necessários</p>
              <p className="text-xs">Essenciais para o funcionamento do site. Sempre ativos.</p>
              <div className="mt-2 text-xs text-jkd-text/70">Status: Ativado</div>
            </div>
            <div className="p-3 rounded-lg border border-jkd-border bg-jkd-bg">
              <p className="font-medium text-jkd-heading">Desempenho</p>
              <p className="text-xs">Ajudam a medir uso e melhorar recursos.</p>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-jkd-border"
                  checked={prefs.performance}
                  onChange={(e) => setPrefs((p) => ({ ...p, performance: e.target.checked }))}
                />
                Ativar cookies de desempenho
              </label>
            </div>
            <div className="p-3 rounded-lg border border-jkd-border bg-jkd-bg">
              <p className="font-medium text-jkd-heading">Marketing</p>
              <p className="text-xs">Personalizam conteúdo e campanhas.</p>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-jkd-border"
                  checked={prefs.marketing}
                  onChange={(e) => setPrefs((p) => ({ ...p, marketing: e.target.checked }))}
                />
                Ativar cookies de marketing
              </label>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button onClick={rejectAll} className="px-4 py-2 rounded-lg border border-jkd-border bg-jkd-bg text-jkd-text hover:bg-jkd-border/30">Recusar</button>
          <button onClick={() => setExpanded((v) => !v)} className="px-4 py-2 rounded-lg border border-jkd-border bg-jkd-bg text-jkd-text hover:bg-jkd-border/30">
            {expanded ? 'Ocultar Preferências' : 'Configurar Preferências'}
          </button>
          {expanded && (
            <button onClick={saveCustom} className="px-4 py-2 rounded-lg bg-church-primary text-white hover:bg-church-primary/90">Salvar Preferências</button>
          )}
          {!expanded && (
            <button onClick={acceptAll} className="px-4 py-2 rounded-lg bg-church-primary text-white hover:bg-church-primary/90">Aceitar Todos</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;