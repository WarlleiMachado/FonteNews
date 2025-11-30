import React, { useEffect, useMemo, useRef, useState } from 'react';
import { defaultCourseSlides, CourseSlide } from './courseSlidesData';

interface CursosCarouselProps {
  slides?: CourseSlide[];
  autoplayMs?: number;
  pauseOnHover?: boolean;
  showIndicators?: boolean;
  showControls?: boolean;
  heightPx?: number;
  initialIndex?: number;
}

// Novo slider de cursos sem iframe, preservando o efeito de giro 3D
const CursosCarousel: React.FC<CursosCarouselProps> = ({
  slides = defaultCourseSlides,
  autoplayMs = 6000,
  pauseOnHover = true,
  showIndicators = true,
  showControls = true,
  heightPx = 700,
  initialIndex = 0,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const total = slides.length;

  const goTo = (i: number) => setIndex(((i % total) + total) % total);
  const goNext = () => goTo(index + 1);
  const goPrev = () => goTo(index - 1);

  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = window.setInterval(goNext, Math.max(2500, autoplayMs));
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); timerRef.current = null; };
  }, [autoplayMs, total, index]);

  const stop = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; } };
  const resume = () => { if (!timerRef.current && total > 1) { timerRef.current = window.setInterval(goNext, Math.max(2500, autoplayMs)); } };

  const rel = useMemo(() => (i: number) => {
    const d = (i - index + total) % total;
    return d > total / 2 ? d - total : d;
  }, [index, total]);

  // Acessibilidade: setas do teclado controlam o slider quando focado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      const isFocused = document.activeElement === containerRef.current || containerRef.current.contains(document.activeElement);
      if (!isFocused) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  return (
    <div
      ref={containerRef}
      className="relative w-full border border-jkd-border bg-jkd-bg-sec overflow-hidden rounded-lg"
      style={{ height: `${heightPx}px` }}
      onMouseEnter={() => pauseOnHover && stop()}
      onMouseLeave={() => pauseOnHover && resume()}
      aria-roledescription="carousel"
      aria-label="Slider de cursos"
      tabIndex={0}
    >
      <div className="absolute inset-0" style={{ perspective: '1100px' }}>
        {slides.map((s, i) => {
          const p = rel(i);
          const isCenter = p === 0;
          const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
          const shift = clamp(p, -2, 2);
          const x = shift * 180;
          const ry = shift * 20;
          const sc = isCenter ? 1 : shift === 0 ? 1 : 0.86 - Math.abs(shift) * 0.07;
          const z = isCenter ? 30 : 20 - Math.abs(shift);
          const op = isCenter ? 1 : 0.92 - Math.abs(shift) * 0.18;
          return (
            <div
              key={`${s.title}-${i}`}
              className="absolute top-0 left-1/2 w-[82%] sm:w-[72%] md:w-[62%] h-full rounded-xl overflow-hidden shadow-lg"
              style={{
                transformStyle: 'preserve-3d',
                transform: `translateX(-50%) translateX(${x}px) scale(${sc}) rotateY(${ry}deg)`,
                transition: 'transform 600ms ease, opacity 600ms ease',
                zIndex: z,
                opacity: op,
              }}
            >
              <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
              {isCenter && (
                <div className="absolute left-0 right-0 bottom-0 p-4 sm:p-6">
                  {s.category && <div className="text-[11px] uppercase tracking-wide text-white/80">{s.category}</div>}
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white max-w-2xl">{s.title}</h2>
                  {s.linkUrl && (
                    <a href={s.linkUrl} target={s.target || '_self'} className="inline-flex mt-3 px-3 py-1.5 rounded-md text-sm bg-white/10 hover:bg-white/20 text-white">
                      Saiba mais
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showControls && total > 1 && (
        <>
          <button aria-label="Anterior" onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-black/50 text-white p-3 rounded-full">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button aria-label="Próximo" onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/35 hover:bg-black/50 text-white p-3 rounded-full">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </>
      )}

      {showIndicators && total > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={`ind-${i}`}
              aria-label={`Ir para slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CursosCarousel;