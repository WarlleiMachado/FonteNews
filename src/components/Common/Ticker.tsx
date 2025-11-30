import React, { useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const Ticker: React.FC = () => {
  const { announcements, cultos, settings, getOccurrences } = useApp();
  const { direction, scope, speed, startDelaySec = 0, restartDelaySec = 0 } = settings.tickerSettings;
  const awareness = settings.awarenessCalendar;

  const normalText = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (scope) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
    }

    // Filtrar anúncios aprovados
    const approvedAnnouncements = announcements.filter(a => a.status === 'approved');
    
    // Combinar anúncios e cultos
    const allItems = [
        ...approvedAnnouncements.map(item => ({...item, type: 'announcement' as const})),
        ...cultos.map(item => ({...item, type: 'culto' as const}))
    ];

    // Processar cada item para obter ocorrências no período
    const upcomingTitles = allItems
      .flatMap(item => {
        // Verificar se o item tem rruleString válido
        if (!item.rruleString || typeof item.rruleString !== 'string' || item.rruleString.trim() === '') {
          return [];
        }

        try {
          // Verificar se o rruleString pode ser parseado
          if (!item.rruleString.startsWith('DTSTART') && !item.rruleString.startsWith('RRULE')) {
            return [];
          }
          
          const occurrences = getOccurrences(item.rruleString, startDate, endDate);
          // Retornar o título para cada ocorrência encontrada
          return occurrences.length > 0 ? [item.title] : [];
        } catch (error) {
          // Log do erro apenas em desenvolvimento
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Erro ao processar ${item.type} "${item.title}":`, error);
          }
          return [];
        }
      })
      .filter((title, index, self) => self.indexOf(title) === index); // Remover títulos duplicados

    if (upcomingTitles.length === 0) {
      return 'Nenhuma programação para o período selecionado.';
    }
    return upcomingTitles.join('  •  ');
  }, [announcements, cultos, scope, getOccurrences]);

  // Sistema robusto de velocidade com escala logarítmica
  const movementDuration = useMemo(() => {
    // Garantir range válido (1-100)
    const normalizedSpeed = Math.max(1, Math.min(100, speed));
    
    // Escala logarítmica invertida para melhor distribuição
    // Velocidade 1 = 60s (muito lento)
    // Velocidade 50 = 12s (normal) 
    // Velocidade 100 = 3s (muito rápido)
    const minDuration = 3;   // Velocidade máxima
    const maxDuration = 60;  // Velocidade mínima
    
    // Usar escala logarítmica para distribuição mais natural
    const logMin = Math.log(minDuration);
    const logMax = Math.log(maxDuration);
    const scale = (logMax - logMin) / 99; // 99 steps (1-100)
    
    // Inverter a escala: velocidade alta = duração baixa
    const logDuration = logMax - (normalizedSpeed - 1) * scale;
    const duration = Math.exp(logDuration);
    
    // Arredondar para 1 casa decimal para precisão
    return Math.round(duration * 10) / 10;
  }, [speed]);

  // Total duration é apenas o movimento + pausa de reinício (pausa de início não afeta o ciclo)
  const totalDuration = movementDuration + (restartDelaySec || 0);


  const imageChoice = (awareness?.imageSource) || 'url';
  const awarenessImage = imageChoice === 'upload' ? (awareness?.imageUploadUrl || '') : (awareness?.imageUrl || '');
  const hasAwareness = !!((awareness?.text && awareness?.text.trim()) || awarenessImage);
  const priority = !!awareness?.priorityEnabled;

  const AwarenessBlock = () => (
    <span className="inline-flex items-center gap-2 px-4">
      {awarenessImage && (
        <img
          src={awarenessImage}
          alt="Logo do mês"
          className="h-6 w-6 object-contain"
        />
      )}
      {awareness?.text && (
        <span>{awareness.text}</span>
      )}
    </span>
  );

  // Calcular percentuais para as pausas
  const movementPct = totalDuration > 0 ? (movementDuration / totalDuration) * 100 : 100;
  const startDelayPct = totalDuration > 0 && startDelaySec > 0 ? (startDelaySec / totalDuration) * 100 : 0;
  const restartDelayPct = totalDuration > 0 && restartDelaySec > 0 ? (restartDelaySec / totalDuration) * 100 : 0;

  return (
    <div className="ticker-container relative z-10 bg-church-primary/10 border-b border-jkd-border overflow-hidden whitespace-nowrap text-sm text-jkd-text h-8 flex items-center">
      <style>
        {`
          @keyframes marquee-left {
            0% { transform: translateX(100%); }
            ${startDelayPct}% { transform: translateX(100%); }
            ${startDelayPct + movementPct}% { transform: translateX(-100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-100%); }
            ${startDelayPct}% { transform: translateX(-100%); }
            ${startDelayPct + movementPct}% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
          .animate-marquee-left {
            animation: marquee-left ${totalDuration}s linear infinite;
          }
          .animate-marquee-right {
            animation: marquee-right ${totalDuration}s linear infinite;
          }
          .ticker-container:hover .ticker-track {
            animation-play-state: paused;
          }
        `}
      </style>
      <div className={`ticker-track inline-flex items-center ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}>
        {priority ? (
          <>
            {hasAwareness && <AwarenessBlock />}
            {normalText && <span className="px-4">{normalText}</span>}
          </>
        ) : (
          <>
            {normalText && <span className="px-4">{normalText}</span>}
            {hasAwareness && <AwarenessBlock />}
          </>
        )}
      </div>
    </div>
  );
};

export default Ticker;
