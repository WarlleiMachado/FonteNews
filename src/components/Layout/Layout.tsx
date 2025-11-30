import React, { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import SiteHeader from '../Site/SiteHeader';
import Footer from './Footer';
import Ticker from '../Common/Ticker';
import { useApp } from '../../hooks/useApp';
import ConfirmationModal from '../Common/ConfirmationModal';
import InputPromptModal from '../Common/InputPromptModal';
import ComposeMessageModal from '../Common/ComposeMessageModal';
import ScrollToTopButton from '../Common/ScrollToTopButton';
import VideoPlayerModal from '../Common/VideoPlayerModal';
import ScriptViewModal from '../Roteiros/ScriptViewModal';
import CookieConsent from '../Common/CookieConsent';
import { useAuth } from '../../hooks/useAuth';
import MaintenanceGuard from '../Common/MaintenanceGuard';
import { anonPresenceManager } from '../../utils/anonPresenceManager';
import { readerPresenceManager } from '../../utils/readerPresenceManager';
import { trackDailyVisit } from '../../utils/visitorTracker';
// Removido import de CourseSlider: slider agora é renderizado na Home




interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { settings, confirmation, hideConfirmation, inputPrompt, hideInputPrompt, composeMessage, hideComposeMessage, isVideoModalOpen, videoSettingsOverride, toggleVideoModal, scriptView, hideScriptView } = useApp();
  const { user, firebaseUser } = useAuth();
  const location = useLocation();
  const isSiteRoute = location.pathname.startsWith('/site');
  const isSiteHome = isSiteRoute && (location.pathname === '/site' || location.pathname === '/site/');
  // const isSliderEmbedRoute = isSiteRoute && (location.pathname === '/site/slider'); // removido: rota não existe mais
  useEffect(() => {
    try {
      console.log('[Layout] route change', {
        path: location.pathname,
        isSiteRoute,
        isSiteHome,
        at: new Date().toISOString(),
      });
    } catch {}
  }, [location.pathname, isSiteRoute, isSiteHome]);

  // Altura responsiva e estado do slider
  const computeHeight = (w: number): number => {
    if (w > 1024) return 900;            // > 1024 => 1240 x 900
    if (w >= 778 && w <= 1023) return 768; // 1023 - 778 => 1024 x 768
    if (w >= 480 && w <= 777) return 960;  // 777 - 480 => 778 x 960
    return 720;                          // < 480 => 480 x 720
  };
  const getSliderHeight = (w: number): number => {
    const h = Number(settings?.sliderHeight ?? 0);
    return h > 0 ? h : computeHeight(w);
  };
  const [responsiveHeight, setResponsiveHeight] = useState<number>(getSliderHeight(typeof window !== 'undefined' ? window.innerWidth : 1024));
  const [sliderReady, setSliderReady] = useState<boolean>(false);
  useEffect(() => {
    const onResize = () => setResponsiveHeight(getSliderHeight(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [settings?.sliderHeight]);
  useEffect(() => {
    setResponsiveHeight(getSliderHeight(typeof window !== 'undefined' ? window.innerWidth : 1024));
  }, [settings?.sliderHeight]);

  // Contabilização diária única por visitante (transação Firestore idempotente)
  useEffect(() => {
    trackDailyVisit();
  }, []);

  // Presença anônima: somente quando NÃO há firebaseUser (visitante realmente anônimo)
  useEffect(() => {
    if (!firebaseUser) {
      anonPresenceManager.setOnline();
    } else {
      anonPresenceManager.setOffline();
    }
    return () => {
      anonPresenceManager.setOffline();
    };
  }, [firebaseUser]);

  // Presença de leitores autenticados: quando há firebaseUser mas não há AuthorizedUser mapeado
  useEffect(() => {
    if (firebaseUser && !user) {
      readerPresenceManager.setOnline();
    } else {
      readerPresenceManager.setOffline();
    }
    return () => {
      readerPresenceManager.setOffline();
    };
  }, [firebaseUser, user]);

  // Removido reset de estado específico do slider

  // Listener de mensagens do iframe do Slider (WordPress) para rolagem
  useEffect(() => {
    if (!isSiteHome) return; // apenas na Home do Site

    const enabled = Boolean(settings.sliderScrollEnabled ?? true);
    if (!enabled) return;

    const expectedOrigin = (settings.sliderMessageOrigin || '').trim();

    const getDefaultOffset = (): number => {
      try {
        const headerEl = document.querySelector('header');
        if (headerEl) {
          const rect = (headerEl as HTMLElement).getBoundingClientRect();
          return Math.ceil(rect.height);
        }
      } catch {}
      return 56; // fallback típico para h-14
    };

    const anchors = Array.isArray(settings.sliderScrollAnchors) ? settings.sliderScrollAnchors : [];

    const smoothScrollTo = (targetEl: Element, offsetPx: number) => {
      const rect = (targetEl as HTMLElement).getBoundingClientRect();
      const top = rect.top + window.scrollY - (offsetPx || 0);
      try {
        window.scrollTo({ top, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, top);
      }
    };

    const tryScrollByAnchorKey = (anchorKey: string, offsetOverride?: number) => {
      const a = anchors.find(x => (x.enabled ?? true) && x.key === anchorKey);
      if (!a) return false;
      const selector = (a.selector || '').trim();
      if (!selector) return false;
      const el = document.querySelector(selector);
      if (!el) return false;
      const offset = typeof offsetOverride === 'number' ? offsetOverride : (typeof a.offsetPx === 'number' ? a.offsetPx! : getDefaultOffset());
      smoothScrollTo(el, offset);
      return true;
    };

    const tryScrollBySelector = (selector: string, offsetOverride?: number) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const offset = typeof offsetOverride === 'number' ? offsetOverride : getDefaultOffset();
      smoothScrollTo(el, offset);
      return true;
    };

    const onMessage = (ev: MessageEvent) => {
      // Segurança básica de origem (se configurada)
      if (expectedOrigin && ev.origin !== expectedOrigin) {
        return;
      }

      const data: any = ev.data || {};
      // Aceitar dois formatos: { type: 'fonte-scroll', anchorKey } ou { type: 'fonte-scroll', selector }
      if (data && data.type === 'fonte-scroll') {
        const key = typeof data.anchorKey === 'string' ? data.anchorKey : '';
        const selector = typeof data.selector === 'string' ? data.selector : '';
        const offset = typeof data.offsetPx === 'number' ? data.offsetPx : undefined;

        let handled = false;
        if (key) {
          handled = tryScrollByAnchorKey(key, offset);
        }
        if (!handled && selector) {
          handled = tryScrollBySelector(selector, offset);
        }
        // Log leve para diagnóstico
        try {
          console.log('[Layout] fonte-scroll', { origin: ev.origin, key, selector, handled });
        } catch {}
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [isSiteHome, settings.sliderScrollAnchors, settings.sliderScrollEnabled, settings.sliderMessageOrigin]);

  return (
    <div className="min-h-screen flex flex-col bg-jkd-bg text-jkd-text transition-colors duration-300">
        
        {(isSiteRoute ? <SiteHeader /> : <Header />)}

        {/* Slider da Home (/site): URL externa por iframe (fallback: snapshot) */}
        {isSiteHome && (
          <div className="w-full">
            <div className="rounded-none border-t border-b border-jkd-border overflow-hidden bg-black/5">
              {(function(){
                const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                const forceSnapshot = params ? (params.get('slider') === 'snapshot') : false;
                const snapshotSrc = "/versao-web-atual/Fonte%20News%20-%20Igreja%20Fonte%20de%20Vida%20Laranjeiras_files/fontesliderhomeheader.html";

                if (forceSnapshot) {
                  return (
                    <iframe
                      src={snapshotSrc}
                      title="Slider da Home"
                      loading="eager"
                      allow="fullscreen; autoplay"
                      onLoad={() => setSliderReady(true)}
                      style={{ width: '100%', height: `${responsiveHeight}px`, border: '0' }}
                    />
                  );
                }

                const hasUrl = !!(settings.sliderUrl && settings.sliderUrl.length > 0);
                const src = (() => {
                  if (!hasUrl) return snapshotSrc;
                  const base = String(settings.sliderUrl);
                  const interval = Number(settings.sliderAutoRefreshMinutes ?? 0);
                  const cacheKey = interval > 0 ? Math.floor(Date.now() / (interval * 60 * 1000)).toString() : '';
                  const sep = base.includes('?') ? '&' : '?';
                  return cacheKey ? `${base}${sep}v=${cacheKey}` : base;
                })();

                return (
                  <iframe
                    src={src}
                    title="Slider da Home"
                    loading="eager"
                    allow="fullscreen; autoplay"
                    onLoad={() => setSliderReady(true)}
                    style={{ width: '100%', height: `${responsiveHeight}px`, border: '0' }}
                  />
                );
              })()}
            </div>
          </div>
        )}

        {/* Ticker antes do conteúdo em todas as rotas (inclui /site) */}
        {settings.tickerSettings.enabled && <Ticker />}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            className="flex-1 relative z-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MaintenanceGuard>
              {children}
            </MaintenanceGuard>
          </motion.main>
        </AnimatePresence>
        <Footer />
  
        <ConfirmationModal isOpen={confirmation.isOpen} title={confirmation.title} message={confirmation.message} onConfirm={confirmation.onConfirm} onCancel={hideConfirmation} />
        <InputPromptModal isOpen={inputPrompt.isOpen} title={inputPrompt.title} message={inputPrompt.message} inputLabel={inputPrompt.inputLabel} onConfirm={inputPrompt.onConfirm} onCancel={hideInputPrompt} />
        <ComposeMessageModal isOpen={composeMessage.isOpen} onClose={hideComposeMessage} replyTo={composeMessage.replyTo} />
        <VideoPlayerModal
          isOpen={isVideoModalOpen}
          onClose={() => toggleVideoModal(false)}
          videoSettings={videoSettingsOverride ?? settings.videoNewsSettings}
        />
        <ScriptViewModal isOpen={scriptView.isOpen} script={scriptView.script} onClose={hideScriptView} />
        <ScrollToTopButton />
        <CookieConsent />
    </div>
  );
};

export default Layout;
