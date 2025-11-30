import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { defaultProgramStartBeepUrl } from '../../utils/sounds';

interface CountdownProps {
  targetDate: Date;
  endDate?: Date;
  title: string;
  overlayUrl?: string;
  variant?: 'default' | 'transparent';
}

const Countdown: React.FC<CountdownProps> = ({ targetDate, endDate, title, overlayUrl, variant = 'default' }) => {
  const { settings } = useApp();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isInProgress, setIsInProgress] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [overlayTransitionSec, setOverlayTransitionSec] = useState(0);
  const programStartAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedStartRef = useRef<boolean>(false);
  const isTransparent = variant === 'transparent';

  useEffect(() => {
    const enabled = settings.countdownOverlayEnabled ?? true;
    const cycle = settings.countdownOverlayCycle ?? {
      visibleSec: 30,
      hiddenSec: 15,
      fadeInSec: 5,
      fadeOutSec: 5,
    };

    const cycleOpacity = 0.3; // intensidade do overlay no ciclo padrão
    const inProgressOpacity = 0.65; // intensidade maior para deixar a imagem bem nítida (não total)
    let timeouts: number[] = [];
    let mounted = true;

    const startCycle = () => {
      if (!mounted) return;
      // Fade-in até opacidade visível
      setOverlayTransitionSec(cycle.fadeInSec);
      setOverlayOpacity(cycleOpacity);

      // Após término do visible + fade-out
      const t1 = window.setTimeout(() => {
        setOverlayTransitionSec(cycle.fadeOutSec);
        setOverlayOpacity(0);
      }, (cycle.fadeInSec + cycle.visibleSec) * 1000);
      timeouts.push(t1);

      // Espera fade-out + período oculto e reinicia
      const t2 = window.setTimeout(() => {
        startCycle();
      }, (cycle.fadeInSec + cycle.visibleSec + cycle.fadeOutSec + cycle.hiddenSec) * 1000);
      timeouts.push(t2);
    };

    // Em andamento: manter overlay sempre visível, sem ciclo
    if (overlayUrl && isInProgress) {
      setOverlayTransitionSec(0);
      setOverlayOpacity(inProgressOpacity);
    } else if (overlayUrl && enabled) {
      // Começa oculto e inicia ciclo após período oculto inicial
      setOverlayTransitionSec(0);
      setOverlayOpacity(0);
      const t0 = window.setTimeout(() => startCycle(), cycle.hiddenSec * 1000);
      timeouts.push(t0);
    } else if (overlayUrl && !enabled) {
      // Comportamento estático original
      setOverlayTransitionSec(0);
      setOverlayOpacity(cycleOpacity);
    } else {
      setOverlayTransitionSec(0);
      setOverlayOpacity(0);
    }

    return () => {
      mounted = false;
      timeouts.forEach(id => clearTimeout(id));
    };
  }, [overlayUrl, settings.countdownOverlayEnabled, settings.countdownOverlayCycle, isInProgress]);

  // Inicializa áudio de início de programação
  useEffect(() => {
    const url = settings.programStartAudioUrl || defaultProgramStartBeepUrl();
    programStartAudioRef.current = new Audio(url);
    programStartAudioRef.current.load();
  }, [settings.programStartAudioUrl]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const end = endDate?.getTime();
      
      // Verifica se o evento está em andamento
      if (end && now >= target && now <= end) {
        setIsInProgress(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      setIsInProgress(false);
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, endDate]);

  // Toca alerta de início da programação por 30s na transição para Em Andamento
  useEffect(() => {
    if (isInProgress && !hasPlayedStartRef.current) {
      if (settings.programStartAudioMuted) {
        hasPlayedStartRef.current = true;
        return;
      }
      if (programStartAudioRef.current) {
        const audio = programStartAudioRef.current;
        audio.loop = false;
        audio.currentTime = 0;
        audio.play().catch(() => {});
        hasPlayedStartRef.current = true;
      }
    }
  }, [isInProgress, settings.programStartAudioMuted]);

  if (isInProgress) {
    return (
      <motion.div
        className={isTransparent ? "relative p-0 text-jkd-heading overflow-visible" : "relative bg-gradient-to-r from-church-primary to-church-primary/80 rounded-lg p-6 text-white overflow-hidden"}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {overlayUrl && !isTransparent && (
          <div
            className="absolute inset-0 bg-center bg-cover z-0"
            style={{ backgroundImage: `url(${overlayUrl})`, opacity: overlayOpacity, transition: `opacity ${overlayTransitionSec}s linear` }}
          />
        )}
        <div className={`relative z-10 flex items-center space-x-2 mb-4 ${isTransparent ? '' : ''}`}>
          <Play size={20} className={isTransparent ? 'text-church-primary' : 'text-white'} />
          <h3 className={`font-semibold text-lg ${isTransparent ? 'text-church-primary' : 'text-white'}`}>Em Andamento</h3>
        </div>
        <p className={`relative z-10 text-sm mb-2 line-clamp-1 ${isTransparent ? 'text-jkd-heading' : 'text-white'}`} title={title}>{title}</p>
        {/* Reservar altura mínima para manter tamanho semelhante ao estado padrão */}
        <div className="relative z-10 h-16" />
      </motion.div>
    );
  }

  return (
    <div className={isTransparent ? "relative p-0 overflow-visible" : "relative bg-gradient-to-r from-church-primary to-church-primary/80 rounded-lg p-6 text-white overflow-hidden"}>
      {overlayUrl && !isTransparent && (
        <div
          className="absolute inset-0 bg-center bg-cover z-0"
          style={{ backgroundImage: `url(${overlayUrl})`, opacity: overlayOpacity, transition: `opacity ${overlayTransitionSec}s linear` }}
        />
      )}
      <div className={`relative z-10 flex items-center space-x-2 mb-4 ${isTransparent ? '' : ''}`}>
        <Clock size={20} className={isTransparent ? 'text-church-primary' : 'text-white'} />
        <h3 className={`font-semibold text-lg ${isTransparent ? 'text-jkd-heading' : 'text-white'}`}>Próxima Programação</h3>
      </div>
      
      <p className={`relative z-10 text-sm mb-4 line-clamp-1 ${isTransparent ? 'text-jkd-heading' : 'text-white'}`} title={title}>{title}</p>
      
      <div className="relative z-10 grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${isTransparent ? 'text-church-primary' : 'text-white'}`}>{timeLeft.days}</div>
          <div className={`text-xs ${isTransparent ? 'text-jkd-text' : 'text-white'}`}>Dias</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${isTransparent ? 'text-church-primary' : 'text-white'}`}>{timeLeft.hours}</div>
          <div className={`text-xs ${isTransparent ? 'text-jkd-text' : 'text-white'}`}>Hs</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${isTransparent ? 'text-church-primary' : 'text-white'}`}>{timeLeft.minutes}</div>
          <div className={`text-xs ${isTransparent ? 'text-jkd-text' : 'text-white'}`}>Min</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${isTransparent ? 'text-church-primary' : 'text-white'}`}>{timeLeft.seconds}</div>
          <div className={`text-xs ${isTransparent ? 'text-jkd-text' : 'text-white'}`}>Seg</div>
        </div>
      </div>
    </div>
  );
};

export default Countdown;
