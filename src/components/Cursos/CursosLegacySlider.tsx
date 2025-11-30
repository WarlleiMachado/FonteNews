import React, { useEffect, useMemo, useRef, useState } from 'react';
import './fsc-style.css';
import { db, storage } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';

// Tipos do slider legado
export type LegacySlide = {
  title: string;
  category?: string;
  image: string;
  link?: string;
  target?: '_self' | '_blank';
  background?: string;
  order?: number;
  active?: boolean;
};

export type LegacySettings = {
  transition_time?: number; // ms
  pause_on_hover?: boolean;
  show_indicators?: boolean;
  contact_email?: string;
  email_color?: string;
  enable_particles?: boolean;
};

const FALLBACK_SLIDES: LegacySlide[] = [
  { title: 'A Mulher Que Prospera', category: 'Mulheres', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop', link: 'https://fontenews.com/curso/amqprospera', target: '_self' },
  { title: 'Crown', category: 'Finanças', image: 'https://images.unsplash.com/photo-1553729784-e91953dec042?q=80&w=1200&auto=format&fit=crop', link: 'https://fontenews.com/curso/crown', target: '_self' },
  { title: 'Casados para Sempre', category: 'Família', image: 'https://images.unsplash.com/photo-1518600506278-4e8ef466b010?q=80&w=1200&auto=format&fit=crop', link: 'https://fontenews.com/curso/casados_para_sempre', target: '_self' },
  { title: 'Homem Único', category: 'Homens', image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1200&auto=format&fit=crop', link: 'https://fontenews.com/curso/homem_unico', target: '_self' },
];

const FALLBACK_SETTINGS: LegacySettings = {
  transition_time: 6000,
  pause_on_hover: true,
  show_indicators: false,
  contact_email: 'secretaria@adfontedevidalaranjeiras.org',
  email_color: '#ffffff',
  enable_particles: false
};

interface CursosLegacySliderProps {
  heightPx?: number;
  noRounded?: boolean; // quando true, remove bordas arredondadas
}

// Tipo resolvido com URLs finalizadas
type ResolvedSlide = LegacySlide & { resolvedImage?: string; resolvedBackground?: string };

const CursosLegacySlider: React.FC<CursosLegacySliderProps> = ({ heightPx = 350, noRounded = false }) => {
  const [slides, setSlides] = useState<LegacySlide[]>(FALLBACK_SLIDES);
  const [resolved, setResolved] = useState<ResolvedSlide[]>([]);
  const [settings, setSettings] = useState<LegacySettings>(FALLBACK_SETTINGS);
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [popup, setPopup] = useState<{ visible: boolean; img?: string; link?: string; target?: '_self' | '_blank'; } | null>(null);

  // Estado de transição dos textos (saída/entrada) e índice exibido
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [textPhase, setTextPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  // Crossfade de fundo: manter duas camadas e animar opacidade
  const [bgPrevUrl, setBgPrevUrl] = useState<string | undefined>(FALLBACK_SLIDES[0]?.image);
  const [bgCurrUrl, setBgCurrUrl] = useState<string | undefined>(FALLBACK_SLIDES[0]?.image);
  const [bgFading, setBgFading] = useState(false);
  const fadeMs = 600;
  const timerRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number>(0);
  const draggingRef = useRef<boolean>(false);
  const dragThreshold = 50;

  // Resolve uma URL: se for http(s), usa direta; se for path de Storage (ex.: /images/...), usa getDownloadURL
  const resolveUrl = async (raw?: string): Promise<string | undefined> => {
    if (!raw) return undefined;
    const t = raw.trim();
    if (!t) return undefined;
    if (/^https?:\/\//i.test(t)) return t;
    // normalizar removendo barra inicial
    const path = t.startsWith('/') ? t.slice(1) : t;
    // Heurística: caminhos começando com images/ são no Storage
    if (/^(images|uploads|assets)\//i.test(path)) {
      try {
        const ref = storageRef(storage, path);
        const url = await getDownloadURL(ref);
        return url;
      } catch (e) {
        // Fallback: tentar como caminho relativo servido pelo Hosting
        return `/${path}`;
      }
    }
    // Outro fallback simples
    return t;
  };

  // Carregar slides e configurações do Firestore
  useEffect(() => {
    (async () => {
      try {
        const qSlides = query(collection(db, 'course_slides'), where('active', '==', true), orderBy('order', 'asc'));
        const slidesSnap = await getDocs(qSlides);
        const loadedSlides: LegacySlide[] = slidesSnap.docs.map(d => {
          const data: any = d.data();
          return {
            title: data.title || '',
            category: data.category || '',
            image: data.imageUrl || data.image || data.coverUrl || '',
            link: data.linkUrl || data.link || '',
            target: (data.target || '_self') as '_self' | '_blank',
            background: data.background || data.imageUrl || data.image || '' ,
            order: data.order || 0,
            active: data.active !== false
          };
        }).filter(s => !!s.image);
        if (loadedSlides.length > 0) setSlides(loadedSlides);

        const settingsDoc = await getDoc(doc(db, 'course_slide_settings', 'default'));
        if (settingsDoc.exists()) {
          const s: any = settingsDoc.data();
          setSettings({
            transition_time: s.autoplayMs || s.transition_time || 6000,
            pause_on_hover: s.pauseOnHover ?? true,
            show_indicators: s.showIndicators ?? false,
            contact_email: s.contact_email || s.email || FALLBACK_SETTINGS.contact_email,
            email_color: s.email_color || FALLBACK_SETTINGS.email_color,
            enable_particles: s.enable_particles ?? false
          });
        }
      } catch (err) {
        console.warn('Falha ao carregar dados de Course Slides. Usando fallback.', err);
      }
    })();
  }, []);

  // Resolver URLs de imagem/background dos slides (Storage -> URL pública)
  useEffect(() => {
    let alive = true;
    (async () => {
      const out: ResolvedSlide[] = await Promise.all(slides.map(async (s) => {
        const [img, bg] = await Promise.all([
          resolveUrl(s.image),
          resolveUrl(s.background)
        ]);
        return { ...s, resolvedImage: img, resolvedBackground: bg };
      }));
      if (alive) setResolved(out);
    })();
    return () => { alive = false; };
  }, [slides]);

  // Função para obter o background do slide atual
  const getBackgroundForIndex = (i: number): string | undefined => {
    const s = slides[i];
    const r = resolved[i];
    return r?.resolvedBackground || r?.resolvedImage || s?.background || s?.image;
  };

  // Crossfade de fundo com pré-carregamento e transição iniciada no próximo frame
  useEffect(() => {
    const nextBg = getBackgroundForIndex(index);
    if (!nextBg) return;
    const img = new Image();
    const startFade = () => {
      setBgPrevUrl(bgCurrUrl || nextBg);
      setBgCurrUrl(nextBg);
      setBgFading(true);
      // inicia a transição no próximo frame para permitir o estado inicial (prev=1, curr=0)
      requestAnimationFrame(() => setBgFading(false));
    };
    img.onload = startFade;
    img.onerror = startFade;
    img.src = nextBg;
  }, [index]);

  // Transição dos textos: sai para a esquerda e entra o novo conteúdo
  useEffect(() => {
    setTextPhase('exiting');
    const outMs = 300;
    const t = window.setTimeout(() => {
      setDisplayedIndex(index);
      setTextPhase('entering');
      requestAnimationFrame(() => setTextPhase('idle'));
    }, outMs);
    return () => window.clearTimeout(t);
  }, [index]);

  // Autoplay
  const resumeAutoplay = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    const ms = Math.max(2500, settings.transition_time || 6000);
    timerRef.current = window.setInterval(() => setIndex(prev => (prev + 1) % slides.length), ms);
  };
  const pauseAutoplay = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; } };

  useEffect(() => { if (slides.length > 1) resumeAutoplay(); return () => pauseAutoplay(); }, [slides, settings.transition_time]);

  // Navegação e atualização
  const goTo = (i: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIndex(((i % slides.length) + slides.length) % slides.length);
    resumeAutoplay();
    window.setTimeout(() => setIsAnimating(false), 700);
  };
  const goPrev = () => goTo(index - 1);
  const goNext = () => goTo(index + 1);

  // Classes por posição (current/past0/past1/future0/future1/hidden)
  const classForIndex = useMemo(() => (i: number) => {
    const total = slides.length;
    let diff = i - index;
    if (Math.abs(diff) > total / 2) diff = diff > 0 ? diff - total : diff + total;
    if (diff === 0) return 'current';
    if (diff === 1) return 'future0';
    if (diff === 2) return 'future1';
    if (diff === -1) return 'past0';
    if (diff === -2) return 'past1';
    return 'hidden';
  }, [index, slides.length]);

  // Dragging
  const dragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isAnimating) return;
    draggingRef.current = true;
    wrapperRef.current?.classList.add('is-dragging');
    startXRef.current = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
    e.preventDefault();
    if (settings.pause_on_hover) pauseAutoplay();
  };
  const dragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return; e.preventDefault();
  };
  const dragEnd = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    wrapperRef.current?.classList.remove('is-dragging');
    const endX = 'changedTouches' in e ? e.changedTouches[0].pageX : (e as React.MouseEvent).pageX;
    const dist = endX - startXRef.current;
    if (Math.abs(dist) > dragThreshold) { if (dist < 0) goNext(); else goPrev(); }
    else {
      // Clique curto no slide central abre popup
      const imgUrl = resolved[index]?.resolvedImage || slides[index]?.image;
      setPopup({ visible: true, img: imgUrl, link: slides[index]?.link, target: slides[index]?.target });
    }
    if (settings.pause_on_hover) resumeAutoplay();
  };

  // Fundo e textos
  const currentSlide = slides[displayedIndex] || slides[0];
  const currentResolved = resolved[displayedIndex] || resolved[0];
  // Removido uso direto de backgroundUrl para evitar flash; usamos camadas e crossfade
  const backgroundUrl = currentResolved?.resolvedBackground || currentResolved?.resolvedImage || currentSlide?.background || currentSlide?.image;

  return (
    <div>
      <div id="fsc_container" className={`fsc-container ${bgFading ? 'is-fading' : ''} ${noRounded ? 'no-rounded' : ''}`} data-particles-enabled={settings.enable_particles ? true : false} style={{ height: `${heightPx}px` }}>
        <canvas id="fsc_magic-dust"></canvas>
        {/* Camadas de fundo para crossfade suave */}
        <div className="fsc-background bg-prev" style={{ backgroundImage: bgPrevUrl ? `url(${bgPrevUrl})` : undefined }} />
        <div className="fsc-background bg-curr" style={{ backgroundImage: bgCurrUrl ? `url(${bgCurrUrl})` : undefined }} />
        <div className="fsc-content">
          <div className="fsc-text-area">
            <div className={`fsc-text-wrapper ${textPhase === 'exiting' ? 'is-exiting' : ''} ${textPhase === 'entering' ? 'is-entering' : ''}`}>
               <div className="fsc-category">{currentSlide?.category || ''}</div>
               <h2 className="fsc-title">{currentSlide?.title || ''}</h2>
              <a
                href={currentSlide?.link || '#'}
                target={currentSlide?.target || '_self'}
                className="fsc-read-more background_shining"
                onClick={(e) => {
                  if (!currentSlide?.link) {
                    e.preventDefault();
                    const imgUrl = currentResolved?.resolvedImage || currentSlide?.image;
                    setPopup({ visible: true, img: imgUrl, link: currentSlide?.link, target: currentSlide?.target });
                  }
                }}
              >
                Leia Mais
              </a>
             </div>
          </div>
          <div className="fsc-image-area">
            <div
              ref={wrapperRef}
              className="fsc-image-wrapper"
              onMouseEnter={() => settings.pause_on_hover && pauseAutoplay()}
              onMouseLeave={() => settings.pause_on_hover && resumeAutoplay()}
              onMouseDown={dragStart}
              onMouseMove={dragMove}
              onMouseUp={dragEnd}
              onTouchStart={dragStart}
              onTouchMove={dragMove}
              onTouchEnd={dragEnd}
            >
              {slides.map((s, i) => {
                const img = resolved[i]?.resolvedImage || s.image;
                return (
                  <div key={`${s.title}-${i}`} className={`fsc-page ${classForIndex(i)}`}>
                    <div className="fsc-card" style={{ backgroundImage: `url(${img})` }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="fsc-navigator">
          <div className="fsc-prev" onClick={goPrev}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </div>
          <div className="fsc-next" onClick={goNext}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>

        {settings.contact_email && (
          <div className="fsc-email-display" style={{ color: settings.email_color || '#ffffff' }}>
            <a href={`mailto:${settings.contact_email}`} style={{ color: 'inherit' }}>{settings.contact_email}</a>
          </div>
        )}
      </div>

      {/* Indicadores opcionais */}
      {settings.show_indicators && slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {slides.map((_, i) => (
            <button key={`ind-${i}`} aria-label={`Ir para slide ${i + 1}`} onClick={() => goTo(i)} className={`h-2 w-2 rounded-full ${i === index ? 'bg-gray-800' : 'bg-gray-400'}`} />
          ))}
        </div>
      )}

      {/* Popup */}
      <div id="fsc_popup_overlay" className={`fsc-popup-overlay ${popup?.visible ? 'is-visible' : ''}`} onClick={() => setPopup(null)}>
        <div className="fsc-popup-content" onClick={e => e.stopPropagation()}>
          {popup?.img && <img src={popup.img} alt="Imagem Ampliada" />}
        </div>
        <div className="fsc-popup-actions">
          {popup?.link && (
            <a href={popup.link} target={popup.target || '_self'} className="fsc-popup-open-link" title="Abrir Link"><i>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </i></a>
          )}
          <a href="#" className="fsc-popup-close-action" title="Fechar" onClick={(e) => { e.preventDefault(); setPopup(null); }}><i>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </i></a>
        </div>
      </div>
    </div>
  );
};

export default CursosLegacySlider;