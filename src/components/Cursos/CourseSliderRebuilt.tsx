import React, { useEffect, useMemo, useRef, useState } from 'react';
import './fsc-style.css';

// Dados locais de exemplo para garantir visual mesmo sem Firestore
// Ajuste conforme necessário ou troque por dados reais quando disponíveis
const sampleSlides = [
  {
    category: 'Curso',
    title: 'Discipulado Essencial',
    image: '/Madu.jpeg',
    background: '/Madu.jpeg',
    link: '#',
    target: '_self',
  },
  {
    category: 'Curso',
    title: 'Fundamentos da Fé',
    image: '/favicon.svg',
    background: '/favicon.svg',
    link: '#',
    target: '_self',
  },
  {
    category: 'Curso',
    title: 'Vida em Comunhão',
    image: '/mural-de-oracao/assets/images/placeholders/default-prayer.jpg',
    background: '/mural-de-oracao/assets/images/placeholders/default-prayer.jpg',
    link: '#',
    target: '_self',
  },
];

const transitionTimeMs = 6000; // tempo padrão de troca automática
const dragThreshold = 50; // mínimo de pixels para considerar arraste válido

const positionClass = (index: number, currentIndex: number, total: number) => {
  let diff = index - currentIndex;
  if (Math.abs(diff) > total / 2) {
    diff = diff > 0 ? diff - total : diff + total;
  }
  if (diff === 0) return 'current';
  if (diff === 1) return 'future0';
  if (diff === 2) return 'future1';
  if (diff === -1) return 'past0';
  if (diff === -2) return 'past1';
  return 'hidden';
};

const ArrowRightSvg = () => (
  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeftSvg = () => (
  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 5 5 12 12 19" />
  </svg>
);

const CourseSliderRebuilt: React.FC = () => {
  const slides = useMemo(() => sampleSlides, []);
  const totalSlides = slides.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [textAnimState, setTextAnimState] = useState<'idle' | 'entering' | 'exiting'>('idle');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const startXRef = useRef<number>(0);
  const autoplayRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const navigate = (direction: number) => {
    updateSlider((currentIndex + direction + totalSlides) % totalSlides);
  };

  const pauseAutoplay = () => {
    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  const resumeAutoplay = () => {
    pauseAutoplay();
    if (transitionTimeMs > 0) {
      autoplayRef.current = window.setInterval(() => navigate(1), transitionTimeMs);
    }
  };

  const updateSlider = (newIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    // texto: ciclo sair -> entrar
    setTextAnimState('exiting');
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setTextAnimState('entering');
      // força reflow virtual com outro tick
      setTimeout(() => setTextAnimState('idle'), 0);
    }, 300);
    resumeAutoplay();
    setTimeout(() => setIsAnimating(false), 700);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    setIsDragging(true);
    startXRef.current = e.pageX;
    wrapperRef.current?.classList.add('is-dragging');
    e.preventDefault();
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    wrapperRef.current?.classList.remove('is-dragging');
    const endX = e.pageX;
    const dist = endX - startXRef.current;
    if (Math.abs(dist) > dragThreshold) {
      navigate(dist < 0 ? 1 : -1);
    } else {
      // clique curto em slide central abre lightbox
      setLightboxOpen(true);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].pageX;
    wrapperRef.current?.classList.add('is-dragging');
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    wrapperRef.current?.classList.remove('is-dragging');
    const endX = e.changedTouches[0].pageX;
    const dist = endX - startXRef.current;
    if (Math.abs(dist) > dragThreshold) {
      navigate(dist < 0 ? 1 : -1);
    } else {
      setLightboxOpen(true);
    }
  };

  useEffect(() => {
    resumeAutoplay();
    return pauseAutoplay;
  }, []);

  const bgUrl = slides[currentIndex]?.background || slides[currentIndex]?.image || '';

  return (
    <div id="fsc_container" className="fsc-container" data-particles-enabled={false}>
      <canvas id="fsc_magic-dust" />
      <div className="fsc-background" style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }} />
      <div className="fsc-content">
        <div className="fsc-text-area">
          <div className={`fsc-text-wrapper ${textAnimState === 'exiting' ? 'is-exiting' : ''} ${textAnimState === 'entering' ? 'is-entering' : ''}`}>
            <div className="fsc-category">{slides[currentIndex]?.category || ''}</div>
            <h4 className="fsc-title">{slides[currentIndex]?.title || ''}</h4>
            <a className="fsc-read-more" href={slides[currentIndex]?.link || '#'} target={slides[currentIndex]?.target || '_self'}>
              <span>Saiba mais</span>
            </a>
          </div>
        </div>
        <div className="fsc-image-area">
          <div
            className="fsc-image-wrapper"
            ref={wrapperRef}
            onMouseEnter={pauseAutoplay}
            onMouseLeave={resumeAutoplay}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {slides.map((s, i) => (
              <div key={i} className={`fsc-page ${positionClass(i, currentIndex, totalSlides)}`}>
                <div className="fsc-card" style={{ backgroundImage: `url(${s.image})` }} />
              </div>
            ))}
          </div>
          <div className="fsc-navigator">
            <div className="fsc-prev" onClick={() => navigate(-1)}>
              <ArrowLeftSvg />
            </div>
            <div className="fsc-next" onClick={() => navigate(1)}>
              <ArrowRightSvg />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox simples */}
      <div id="fsc_popup_overlay" className={`fsc-popup-overlay ${lightboxOpen ? 'is-visible' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}>
        <div className="fsc-popup-actions">
          <a className="fsc-popup-open-link" href={slides[currentIndex]?.link || '#'} target={slides[currentIndex]?.target || '_self'}>
            <i><ArrowRightSvg /></i>
          </a>
          <a className="fsc-popup-close-action" href="#" onClick={(e) => { e.preventDefault(); setLightboxOpen(false); }}>
            <i><ArrowLeftSvg /></i>
          </a>
        </div>
        <div className="fsc-popup-content" onClick={(e) => e.stopPropagation()}>
          {slides[currentIndex]?.image && (
            <img src={slides[currentIndex].image} alt={slides[currentIndex].title} />
          )}
        </div>
      </div>

      {/* Disclaimer opcional de contato, replicando estilo */}
      <div className="fsc-email-display">
        <a href="mailto:secretaria@fontenews">secretaria@fontenews</a>
      </div>
    </div>
  );
};

export default CourseSliderRebuilt;