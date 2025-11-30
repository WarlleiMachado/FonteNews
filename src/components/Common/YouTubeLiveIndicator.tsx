import React, { useEffect, useMemo, useState } from 'react';
import { Play, Radio } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { addUsage, resetIfNewMonth, canSpend } from '../../utils/youtubeLiveUsage';

/**
 * YouTubeLiveIndicator (tile 16:9)
 * - Lê configurações de `settings.youtubeLive` (Gerenciamento).
 * - Checa status via YouTube Data API v3 e cacheia em localStorage.
 * - Exibe reprodução de fundo (autoplay mudo) quando ao vivo e oculta ao abrir pop-up.
 * - Mostra botão "Assistir agora" que abre o modal e um ícone SVG animado.
 */
const STORAGE_KEY = 'fonte_news_youtube_live_cache';

type CacheRecord = {
  isLive: boolean;
  videoId?: string;
  expiresAt: number; // epoch ms
};

const safeParseCache = (): CacheRecord | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return null;
    return obj as CacheRecord;
  } catch {
    return null;
  }
};

const saveCache = (rec: CacheRecord) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rec)); } catch {}
};

const YouTubeLiveIndicator: React.FC = () => {
  const { settings, toggleVideoModal, isVideoModalOpen } = useApp();

  const apiKey = settings.youtubeLive?.apiKey || ((import.meta.env.VITE_YT_API_KEY as string) || '');
  const channelId = settings.youtubeLive?.channelId || ((import.meta.env.VITE_YT_CHANNEL_ID as string) || '');
  const cacheSeconds = Math.max(10, Number(settings.youtubeLive?.cacheSeconds ?? 60));
  const forceVideoId = (settings.youtubeLive?.forceVideoId || '').trim();

  const enabled = useMemo(() => Boolean(settings.youtubeLive?.enabled), [settings.youtubeLive?.enabled]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [videoId, setVideoId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [hideBg, setHideBg] = useState<boolean>(false);
  const [pageVisible, setPageVisible] = useState<boolean>(typeof document !== 'undefined' ? document.visibilityState === 'visible' : true);

  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const ttlFor = (live: boolean) => Math.min(cacheSeconds, live ? 15 : 30) * 1000;

  const checkLive = async () => {
    if (!enabled) return;
    if (!pageVisible) return; // evita consultas desnecessárias quando aba não está visível
    setLoading(true);
    setError(null);

    // Forçar via settings (útil para testes/overrides)
    if (forceVideoId && forceVideoId.length === 11) {
      setIsLive(true);
      setVideoId(forceVideoId);
      const rec: CacheRecord = {
        isLive: true,
        videoId: forceVideoId,
        expiresAt: Date.now() + ttlFor(true),
      };
      saveCache(rec);
      setLoading(false);
      return;
    }

    // Tentar retornar do cache se ainda estiver válido
    const cached = safeParseCache();
    if (cached && cached.expiresAt > Date.now()) {
      setIsLive(cached.isLive);
      setVideoId(cached.videoId);
      setLoading(false);
      return;
    }

    try {
      // Controle de créditos mensais
      try { resetIfNewMonth(); } catch {}
      const spend = canSpend(1);
      if (!spend.ok) {
        setError('Limite mensal atingido para consultas ao YouTube.');
        setLoading(false);
        return;
      }

      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('channelId', channelId!);
      url.searchParams.set('eventType', 'live');
      url.searchParams.set('type', 'video');
      url.searchParams.set('key', apiKey!);

      const res = await fetch(url.toString());
      if (!res.ok) {
        let friendly = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          const apiMsg = (j?.error?.message as string | undefined) || '';
          if (apiMsg) friendly = apiMsg;
        } catch {}
        if (res.status === 403) {
          friendly = 'Acesso bloqueado (403). Verifique chave da API e restrições de domínio (localhost/web.app) e se o YouTube Data API v3 está habilitado.';
        }
        throw new Error(friendly);
      }
      const json = await res.json();
      const item = Array.isArray(json?.items) ? json.items[0] : undefined;
      const liveId = item?.id?.videoId as string | undefined;

      const live = Boolean(liveId);
      setIsLive(live);
      setVideoId(liveId);

      // Contabiliza uso mensal (controle local)
      try { addUsage(1); } catch {}

      const rec: CacheRecord = {
        isLive: live,
        videoId: liveId,
        expiresAt: Date.now() + ttlFor(live),
      };
      saveCache(rec);
    } catch (e: any) {
      setError(e?.message || 'Falha ao consultar status do Fonte Live');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return; // Só checa se está habilitado
    if (!apiKey || !channelId) return; // requer chaves
    checkLive();
    const id = window.setInterval(checkLive, Math.max(30, cacheSeconds) * 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, apiKey, channelId, cacheSeconds, forceVideoId]);

  // Ocultar/mostrar reprodução de fundo quando o modal de vídeo estiver aberto
  useEffect(() => {
    const shouldHide = Boolean(settings.youtubeLive?.hideBackgroundOnPopup) && isVideoModalOpen;
    setHideBg(shouldHide);
  }, [isVideoModalOpen, settings.youtubeLive?.hideBackgroundOnPopup]);

  const handleWatch = () => {
    if (!enabled) return;
    // Se já temos o ID, usar embed direto; senão usar live_stream por canal
    const embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      : `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&rel=0`;
    toggleVideoModal(true, { enabled: true, sourceType: 'youtube', url: embedUrl });
  };

  if (!enabled) {
    return null; // Oculta totalmente se não estiver habilitado
  }

  return (
      <div className="relative rounded-lg overflow-hidden bg-jkd-bg border border-jkd-border aspect-video">
        {/* Ícone animado topo-direita — só quando ao vivo */}
        {isLive && (
          <div className="absolute top-2 right-2 text-church-primary z-30 pointer-events-none">
            <svg viewBox='0 0 24 24' width='24' height='24' xmlns='http://www.w3.org/2000/svg'>
              <circle cx='12' cy='12' r='0' fill='currentColor'>
                <animate id='SVGPW9ARccz' fill='freeze' attributeName='r' begin='0;SVGaeu34cWL.end' calcMode='spline' dur='1.2s' keySplines='.52,.6,.25,.99' values='0;11'/>
                <animate fill='freeze' attributeName='opacity' begin='0;SVGaeu34cWL.end' calcMode='spline' dur='1.2s' keySplines='.52,.6,.25,.99' values='1;0'/>
              </circle>
              <circle cx='12' cy='12' r='0' fill='currentColor'>
                <animate id='SVGODvPjeTJ' fill='freeze' attributeName='r' begin='SVGPW9ARccz.begin+0.2s' calcMode='spline' dur='1.2s' keySplines='.52,.6,.25,.99' values='0;11'/>
                <animate fill='freeze' attributeName='opacity' begin='SVGPW9ARccz.begin+0.2s' calcMode='spline' dur='1.2s' keySplines='.52,.6,.25,.99' values='1;0'/>
              </circle>
              <circle cx='12' cy='12' r='0' fill='currentColor'>
                <animate id='SVGaeu34cWL' fill='freeze' attributeName='r' begin='SVGPW9ARccz.begin+0.4s' calcMode='spline' dur='1.2s' keySplines='.52,.6,.25,.99' values='0;11'/>
                <animate fill='freeze' attributeName='opacity' begin='SVGPW9ARccz.begin+0.4s' calcMode='spline' dur='1.2s' keySplines='.52,.6,.25,.99' values='1;0'/>
              </circle>
            </svg>
          </div>
        )}

        {/* Título sobreposto topo-esquerda */}
        <div className="absolute top-2 left-3 z-30">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-church-primary" />
            <span className="text-sm font-semibold text-church-primary">Fonte Live</span>
          </div>
        </div>

        {/* Reprodução de fundo (iframe) quando ao vivo */}
        {isLive && !hideBg && (
          <iframe
            className="absolute inset-0 w-full h-full z-10 pointer-events-none"
            src={
              videoId
                ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&playsinline=1&modestbranding=1&rel=0&showinfo=0`
                : `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=1&controls=0&playsinline=1&modestbranding=1&rel=0&showinfo=0`
            }
            title="Fonte Live Background"
            allow="autoplay; encrypted-media"
            aria-hidden="true"
            style={{ opacity: Math.max(0, Math.min(1, settings.youtubeLive?.backgroundOpacity ?? 1)) }}
          />
        )}

        {/* Placeholder offline / não configurado */}
        {(!isLive || hideBg) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-4">
              <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${isLive ? 'bg-red-600 text-white border-red-700' : 'bg-jkd-bg text-jkd-text border-jkd-border'}`}>
                <span className={`inline-block h-2 w-2 rounded-full ${isLive ? 'bg-white animate-pulse' : 'bg-jkd-text/50'}`} />
                {loading ? 'Checando…' : isLive ? 'Transmissão Ao Vivo' : 'Fonte Live...'}
              </div>
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
              {!apiKey || !channelId ? (
                <p className="mt-2 text-xs text-jkd-text">Configure API Key e Channel ID em Gerenciamento → Fonte Live.</p>
              ) : null}
          </div>
        </div>
        )}

        {/* CTA Assistir agora */}
        {isLive && (
          <div className="absolute bottom-3 right-3 z-30">
            <button
              onClick={handleWatch}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-church-primary text-white text-sm hover:bg-church-primary/90 shadow"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Assistir agora
            </button>
          </div>
        )}
      </div>
  );
};

export default YouTubeLiveIndicator;