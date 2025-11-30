import React, { useEffect, useMemo, useRef, useState } from 'react';
import './LegacyFSC.css';
import type { FsData, SlideData, SettingsData } from './types';

interface LegacyFSCProps { data: FsData | null; className?: string }

const clampIndex = (idx: number, len: number) => (len <= 0 ? 0 : (idx + len) % len);

function positionClass(idx: number, current: number, len: number): 'current'|'past0'|'past1'|'future0'|'future1'|'hidden' {
  if (len <= 0) return 'hidden';
  let diff = idx - current;
  const half = Math.floor(len / 2);
  if (diff > half) diff -= len;
  if (diff < -half) diff += len;
  if (diff === 0) return 'current';
  if (diff === -1) return 'past0';
  if (diff === -2) return 'past1';
  if (diff === 1) return 'future0';
  if (diff === 2) return 'future1';
  return 'hidden';
}

const LegacyFSC: React.FC<LegacyFSCProps> = ({ data, className = '' }) => {
  const slides: SlideData[] = data?.slides || [];
  const settings: SettingsData = data?.settings || {};
  const transitionMs = parseInt(String(settings.transition_time), 10) || 6000;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [popupSlide, setPopupSlide] = useState<SlideData | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [textPhase, setTextPhase] = useState<'idle'|'entering'|'exiting'>('idle');
  const [hovering, setHovering] = useState(false);

  // Background crossfade state
  const resolveBgUrl = (s?: SlideData, st?: SettingsData): string => {
    const img = (s?.image || '').trim();
    const bg = (s?.background || '').trim();
    const defBg = (st?.background_image || '').trim();
    return bg || img || defBg || '';
  };
  const [bgPrevUrl, setBgPrevUrl] = useState<string>('');
  const [bgCurrUrl, setBgCurrUrl] = useState<string>('');
  const [bgFading, setBgFading] = useState<boolean>(false);
  const bgFadeMs = 600;

  useEffect(() => { setCurrent(0); }, [slides.length]);

  // Initialize background on mount/data load
  useEffect(() => {
    const initial = resolveBgUrl(slides[0], settings);
    setBgPrevUrl(initial);
    setBgCurrUrl(initial);
  }, [slides.length]);

  // Crossfade when current changes
  // Crossfade de fundo com preload para evitar "piscada"
  useEffect(() => {
    const nextUrl = resolveBgUrl(slides[current], settings);
    let cleanupTimeout: number | null = null;
    let canceled = false;

    if (!nextUrl) {
      setBgFading(false);
      setBgCurrUrl("");
      setBgPrevUrl("");
      return () => {};
    }

    if (nextUrl === bgCurrUrl) {
      setBgPrevUrl(nextUrl);
      setBgFading(false);
      return () => {};
    }

    const img = new Image();
    img.onload = () => {
      if (canceled) return;
      setBgPrevUrl(bgCurrUrl || nextUrl);
      setBgCurrUrl(nextUrl);
      setBgFading(true);
      cleanupTimeout = window.setTimeout(() => {
        if (canceled) return;
        setBgPrevUrl(nextUrl);
        setBgFading(false);
      }, bgFadeMs);
    };
    img.onerror = () => {
      // Se falhar o preload, faz o switch sem fade para evitar flicker prolongado
      if (canceled) return;
      setBgPrevUrl(bgCurrUrl || nextUrl);
      setBgCurrUrl(nextUrl);
      setBgFading(false);
    };
    img.src = nextUrl;

    return () => {
      canceled = true;
      if (cleanupTimeout) window.clearTimeout(cleanupTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  // Autoplay
  useEffect(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (slides.length > 1 && transitionMs > 0 && !paused) {
      intervalRef.current = window.setInterval(() => {
        setCurrent(c => clampIndex(c + 1, slides.length));
        setTextPhase('exiting');
        window.setTimeout(() => {
          setTextPhase('entering');
          window.setTimeout(() => { setTextPhase('idle'); }, 350);
        }, 0);
      }, transitionMs);
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [slides.length, transitionMs, paused]);

  const positions = useMemo(() => {
    const len = slides.length;
    return slides.map((slide, idx) => ({ idx, slide, cls: positionClass(idx, current, len) }));
  }, [slides, current]);

  const currentSlide = slides[current];
  const fontColor = currentSlide?.fontColor || undefined;
  const bgColor = currentSlide?.bgColor || undefined;

  const next = () => {
    setCurrent(c => clampIndex(c + 1, slides.length));
    setTextPhase('exiting');
    window.setTimeout(() => { setTextPhase('entering'); window.setTimeout(() => { setTextPhase('idle'); }, 350); }, 0);
  };
  const prev = () => {
    setCurrent(c => clampIndex(c - 1, slides.length));
    setTextPhase('exiting');
    window.setTimeout(() => { setTextPhase('entering'); window.setTimeout(() => { setTextPhase('idle'); }, 350); }, 0);
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setDragStartX(x);
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
  };
  const onUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const x = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const start = dragStartX ?? x;
    const dx = x - start;
    setIsDragging(false);
    setDragStartX(null);
    if (dx > 50) { prev(); return; }
    if (dx < -50) { next(); return; }
    // Sem movimento: nada aqui, o clique é tratado no card
  };

  const textWrapperClass = `fsc-text-wrapper ${textPhase === 'exiting' ? 'is-exiting' : textPhase === 'entering' ? 'is-entering' : 'is-visible'}`;

  const emailColor = settings.email_color || '#ffffff';
  const displayEmail = (settings.contact_email || '').trim();

  return (
    <div className={`fsc-container ${className}`} onMouseEnter={() => { setPaused(true); setHovering(true); }} onMouseLeave={() => { setPaused(false); setHovering(false); }}>
      {/* Background layers for smooth crossfade */}
      <div
        className={`fsc-background bg-prev ${bgFading ? 'fade-out' : ''}`}
        style={{
          backgroundImage: bgPrevUrl ? `url(${bgPrevUrl})` : undefined,
          backgroundColor: bgColor || undefined,
        }}
      />
      <div
        className={`fsc-background bg-curr ${bgFading ? 'fade-in' : ''}`}
        style={{
          backgroundImage: bgCurrUrl ? `url(${bgCurrUrl})` : undefined,
          backgroundColor: bgColor || undefined,
        }}
      />

      {/* Conteúdo */}
      <div className={'fsc-content'}>
        {/* Texto */}
        <div className={'fsc-text-area'}>
          <div className={textWrapperClass}>
            <div className={'fsc-category'} style={{ color: fontColor || undefined }}>{currentSlide?.category || ''}</div>
            <h2 className={'fsc-title'} style={{ color: fontColor || undefined }}>{currentSlide?.title || ''}</h2>
            {currentSlide?.link && (
              <a
                 href={currentSlide.link}
                 target={currentSlide.target === '_blank' ? '_blank' : '_self'}
                 rel={currentSlide.target === '_blank' ? 'noopener noreferrer' : undefined}
                 className={'fsc-read-more background_shining'}
                 style={{ color: fontColor || undefined }}
               >
                 Leia Mais
               </a>
            )}
          </div>
        </div>

        {/* Coverflow */}
        <div className={'fsc-image-area'}>
          <div
            className={`fsc-image-wrapper ${isDragging ? 'is-dragging' : ''}`}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={() => isDragging && onUp(new MouseEvent('mouseup') as any)}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          >
            {positions.map(({ idx, slide, cls }) => {
              const bgImage = (slide.image && slide.image.trim().length > 0) ? slide.image : (slide.background || '');
              const style: React.CSSProperties = { backgroundImage: bgImage ? `url(${bgImage})` : undefined, backgroundColor: slide.bgColor || undefined };
              return (
                <div key={`slide-${idx}`} className={`fsc-page ${cls}`} onClick={cls === 'current' ? () => { setPopupSlide(slide); setPaused(true); } : undefined}>
                  <div className={'fsc-card'} style={style} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className={'fsc-navigator'}>
        <div className={'fsc-prev'} onClick={prev} aria-label="Anterior">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </div>
        <div className={'fsc-next'} onClick={next} aria-label="Próximo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </div>
      </div>

      {/* Email opcional */}
      {displayEmail && (
        <div className={'fsc-email-display'}>
          <a href={`mailto:${displayEmail}`} style={{ color: emailColor }}>{displayEmail}</a>
        </div>
      )}

      {/* Popup */}
      <div className={`fsc-popup-overlay ${popupSlide ? 'open' : ''}`} onClick={() => { setPopupSlide(null); setPaused(false); }}>
        <div className={'fsc-popup-content'} onClick={(e) => e.stopPropagation()}>
          <div className={'fsc-popup-header'}>
            <strong>{popupSlide?.category || ''}</strong>
            <span className={'fsc-popup-close'} onClick={() => { setPopupSlide(null); setPaused(false); }}>Fechar</span>
          </div>
          <div className={'fsc-popup-body'}>
            <h3 style={{ margin: '0 0 12px' }}>{popupSlide?.title || ''}</h3>
            {popupSlide?.image && (
              <div style={{ width: '100%', paddingTop: '89.5%', backgroundImage: `url(${popupSlide.image})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 8 }} />
            )}
          </div>
          <div className={'fsc-popup-actions'}>
            {popupSlide?.link && (
              <a
                href={popupSlide.link}
                target={popupSlide.target === '_blank' ? '_blank' : '_self'}
                rel={popupSlide.target === '_blank' ? 'noopener noreferrer' : undefined}
                className={'fsc-read-more background_shining'}
              >
                Abrir link
              </a>
            )}
            <button className={'fsc-popup-close'} onClick={() => { setPopupSlide(null); setPaused(false); }}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegacyFSC;