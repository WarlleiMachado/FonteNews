import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useThrottle } from '../../hooks/useDebounce';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScroll = () => {
    const scrollY = window.scrollY;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (scrollY > 400) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
    
    setProgress(totalHeight > 0 ? scrollY / totalHeight : 0);
  };

  const scrollToTop = () => {
    // Rolagem suave personalizada com easing e clamp final em 0
    const startY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const duration = 2000; // ms – velocidade constante e easing no final
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Fase 1: velocidade constante até ~85% do tempo
      // Fase 2: easing (easeOutCubic) nos últimos ~15% para suavizar a chegada
      const linearPhaseEnd = 0.85;
      let proportionRemaining: number; // proporção da distância que ainda falta

      if (t < linearPhaseEnd) {
        // Linear puro (constante): percorre 85% da distância em 85% do tempo
        proportionRemaining = 1 - t;
      } else {
        // Últimos 15% com easing
        const tr = (t - linearPhaseEnd) / (1 - linearPhaseEnd); // 0..1
        const easedTail = easeOutCubic(tr);
        proportionRemaining = (1 - easedTail) * (1 - linearPhaseEnd); // 0.15..0
      }

      const newY = Math.max(0, Math.round(startY * proportionRemaining));

      // Aplica a posição calculada
      window.scrollTo(0, newY);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        // Garante que finalize exatamente em 0
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    requestAnimationFrame(step);
  };

  // Throttled handlers to prevent excessive calls
  const throttledHandleScroll = useThrottle(handleScroll, 16); // ~60fps
  const throttledScrollToTop = useThrottle(scrollToTop, 300);

  useEffect(() => {
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledHandleScroll);
  }, [throttledHandleScroll]);

  const radius = 18; // Raio ajustado para o novo tamanho
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.button
      onClick={throttledScrollToTop}
      className="fixed right-6 z-50 h-10 w-10 rounded-full bg-jkd-bg-sec shadow-lg border border-jkd-border flex items-center justify-center text-church-primary focus:outline-none focus:ring-2 focus:ring-church-primary focus:ring-offset-2 focus:ring-offset-jkd-bg safe-bottom-6"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Voltar ao topo"
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          strokeWidth="2.5"
          className="stroke-current text-jkd-border"
          fill="none"
        />
        <motion.circle
          cx="20"
          cy="20"
          r={radius}
          strokeWidth="2.5"
          className="stroke-current text-church-primary"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          }}
        />
      </svg>
      <ArrowUp size={20} className="relative" />
    </motion.button>
  );
};

export default ScrollToTopButton;
