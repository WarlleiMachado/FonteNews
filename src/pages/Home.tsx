import React, { useEffect, useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone, MapPin, Clock, Bell, Search, Play } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';
import AnnouncementCard from '../components/Common/AnnouncementCard';
import Countdown from '../components/Common/Countdown';
import MiniCalendar from '../components/Common/MiniCalendar';
import YouTubeLiveIndicator from '../components/Common/YouTubeLiveIndicator';
import VGAIcon from '../components/Common/VGAIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { RRule } from 'rrule';
// import CourseSlider removido: slider fica apenas na Home do site

const Home: React.FC = () => {
  const { announcements, cultos, settings, getOccurrences, toggleVideoModal } = useApp();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const leftMasterRef = useRef<HTMLDivElement | null>(null);
  const rightMasterRef = useRef<HTMLDivElement | null>(null);
  const HEADER_OFFSET = 96; // ~top-24
  const GAP_BELOW_MASTER = 24; // espaçamento padrão abaixo do master
  const [leftStickyTop, setLeftStickyTop] = useState<number>(HEADER_OFFSET);
  const [rightStickyTop, setRightStickyTop] = useState<number>(HEADER_OFFSET);

  // Atualização em tempo real: reavalia filtros a cada 30s
  useEffect(() => {
    // Atualiza mais frequentemente para transições em tempo quase real
    const id = window.setInterval(() => setNowTick(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  // Calcula offsets sticky com base na altura real do header
  useLayoutEffect(() => {
    const recalc = () => {
      const headerEl = document.querySelector('header');
      const headerHeight = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : HEADER_OFFSET;
      setLeftStickyTop(headerHeight);
      setRightStickyTop(headerHeight);
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, []);

  // Removido: Função para criar dados de exemplo automaticamente
  // A criação de dados deve ser feita manualmente pelos administradores
  // useEffect(() => {
  //   const checkAndCreateSampleData = async () => {
  //     console.log('🔍 DEBUG - Verificando dados:', { 
  //       announcements: announcements.length, 
  //       cultos: cultos.length 
  //     });
  //     
  //     if (announcements.length === 0 && cultos.length === 0) {
  //       console.log('🌱 Nenhum dado encontrado, criando dados de exemplo...');
  //       await createSampleData();
  //     } else {
  //       console.log('✅ Dados já existem, não criando exemplos');
  //     }
  //   };

  //   // Só executa se os dados já foram carregados (não estão vazios por ainda estar carregando)
  //   if (announcements !== undefined && cultos !== undefined) {
  //     checkAndCreateSampleData();
  //   }
  // }, [announcements, cultos]);

  const approvedAnnouncements = useMemo(() => {
    return announcements.filter(a => a.status === 'approved');
  }, [announcements]);

  const allUpcomingItems = useMemo(() => {
    const now = new Date();
    // Incluir ocorrências que começaram mais cedo no dia para detectar "Em andamento"
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    const announcementOccurrences = approvedAnnouncements
      .flatMap(a => getOccurrences(a.rruleString, startOfDay, nextYear).map(date => {
        // Ajusta startDate com horário de início definido em dtstart (se houver)
        let startDate = new Date(date);
        let hasStartTime = false;
        try {
          const rule = RRule.fromString(a.rruleString);
          const dtstart: Date | undefined = (rule as any).options?.dtstart;
          if (dtstart) {
            const sh = dtstart.getHours();
            const sm = dtstart.getMinutes();
            hasStartTime = (sh + sm) > 0;
            if (hasStartTime) {
              startDate.setHours(sh || 0, sm || 0, 0, 0);
            }
          }
        } catch {}

        // Calcula endDate se endTime estiver disponível
        let endDate = undefined;
        if (a.endTime) {
          const [hours, minutes] = a.endTime.split(':').map(Number);
          endDate = new Date(startDate);
          endDate.setHours(hours, minutes, 0, 0);
        }
        return { 
          title: a.title, 
          date: startDate, 
          endDate,
          source: a,
          hasStartTime,
        };
      }));

    const cultoOccurrences = cultos
      .flatMap(c => getOccurrences(c.rruleString, startOfDay, nextYear).map(date => {
        // Ajusta startDate com horário de início definido em dtstart (se houver)
        let startDate = new Date(date);
        let hasStartTime = false;
        try {
          const rule = RRule.fromString(c.rruleString);
          const dtstart: Date | undefined = (rule as any).options?.dtstart;
          if (dtstart) {
            const sh = dtstart.getHours();
            const sm = dtstart.getMinutes();
            hasStartTime = (sh + sm) > 0;
            if (hasStartTime) {
              startDate.setHours(sh || 0, sm || 0, 0, 0);
            }
          }
        } catch {}

        // Calcula endDate se endTime estiver disponível
        let endDate = undefined;
        if (c.endTime) {
          const [hours, minutes] = c.endTime.split(':').map(Number);
          endDate = new Date(startDate);
          endDate.setHours(hours, minutes, 0, 0);
        }
        return { 
          title: c.title, 
          date: startDate, 
          endDate,
          source: c,
          hasStartTime,
        };
      }));

    return [...announcementOccurrences, ...cultoOccurrences];
  }, [approvedAnnouncements, cultos, getOccurrences]);

  const currentProgramming = useMemo(() => {
    const now = new Date();
    // Detectar eventos em andamento levando em conta horário de início (dtstart)
    const inProgressCandidates = allUpcomingItems.filter(item => {
      if (!item.endDate) return false;
      if (!('hasStartTime' in item) || !(item as any).hasStartTime) return false;
      // item.date já considera horário de início quando dtstart define hora/minuto
      return item.date <= now && item.endDate >= now;
    });
    if (inProgressCandidates.length === 0) return null;
    const sorted = inProgressCandidates.sort((a, b) => {
      const aTime = a.date instanceof Date ? a.date.getTime() : 0;
      const bTime = b.date instanceof Date ? b.date.getTime() : 0;
      return aTime - bTime;
    });
    return sorted[0];
  }, [allUpcomingItems, nowTick]);

  const nextProgramming = useMemo(() => {
    const now = new Date();
    const sortedUpcoming = allUpcomingItems
      .filter(item => item.date > now)
      .sort((a, b) => {
        const aTime = a.date instanceof Date ? a.date.getTime() : 0;
        const bTime = b.date instanceof Date ? b.date.getTime() : 0;
        return aTime - bTime;
      });
    return sortedUpcoming.length > 0 ? sortedUpcoming[0] : null;
  }, [allUpcomingItems, nowTick]);

  const filteredAndRecentAnnouncements = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    const isInProgress = (a: any): boolean => {
      const todays = getOccurrences(a.rruleString, startOfToday, endOfToday);
      if (todays.length === 0 || !a.endTime) return false;
      let startDate = todays[0];
      let hasStartTime = false;
      try {
        const rule = RRule.fromString(a.rruleString);
        const dtstart: Date | undefined = (rule as any).options?.dtstart;
        if (dtstart) {
          const sh = dtstart.getHours();
          const sm = dtstart.getMinutes();
          hasStartTime = (sh + sm) > 0;
          if (hasStartTime) {
            startDate = new Date(startDate);
            startDate.setHours(sh || 0, sm || 0, 0, 0);
          }
        }
      } catch {}
      if (!hasStartTime) return false;
      const [eh, em] = a.endTime.split(':').map(Number);
      const endDate = new Date(startDate);
      endDate.setHours(eh || 0, em || 0, 0, 0);
      return startDate <= now && endDate >= now;
    };

    const hasUpcoming = (a: any): boolean => getOccurrences(a.rruleString, now, nextYear).length > 0;

    return approvedAnnouncements
      .filter(a => hasUpcoming(a) || isInProgress(a))
      .filter(announcement => {
        if (!searchTerm) return true;
        const lower = searchTerm.toLowerCase();
        return announcement.title.toLowerCase().includes(lower) || announcement.content.toLowerCase().includes(lower);
      })
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [approvedAnnouncements, searchTerm, getOccurrences, nowTick]);

  // Contagens dinâmicas: apenas programações com próximas ocorrências ou em andamento
  const activeApprovedAnnouncements = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    const isInProgress = (a: any): boolean => {
      const todays = getOccurrences(a.rruleString, startOfToday, endOfToday);
      if (todays.length === 0 || !a.endTime) return false;
      let startDate = todays[0];
      let hasStartTime = false;
      try {
        const rule = RRule.fromString(a.rruleString);
        const dtstart: Date | undefined = (rule as any).options?.dtstart;
        if (dtstart) {
          const sh = dtstart.getHours();
          const sm = dtstart.getMinutes();
          hasStartTime = (sh + sm) > 0;
          if (hasStartTime) {
            startDate = new Date(startDate);
            startDate.setHours(sh || 0, sm || 0, 0, 0);
          }
        }
      } catch {}
      if (!hasStartTime) return false;
      const [eh, em] = a.endTime.split(':').map(Number);
      const endDate = new Date(startDate);
      endDate.setHours(eh || 0, em || 0, 0, 0);
      return startDate <= now && endDate >= now;
    };

    const hasUpcoming = (a: any): boolean => getOccurrences(a.rruleString, now, nextYear).length > 0;

    return approvedAnnouncements.filter(a => hasUpcoming(a) || isInProgress(a));
  }, [approvedAnnouncements, getOccurrences, nowTick]);

  // Destaque News slideshow
  const newsImages = settings.newsHighlightImages || [];
  const effect = settings.newsHighlightOptions?.effect || 'fade';
  const durationSec = settings.newsHighlightOptions?.durationSec || 8;
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  React.useEffect(() => {
    if (!newsImages || newsImages.length <= 1) return; // sem timer se 0 ou 1 imagem
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsImages.length);
    }, Math.max(2, durationSec) * 1000);
    return () => clearInterval(interval);
  }, [newsImages, durationSec]);

  const currentCountdownSource = (currentProgramming || nextProgramming);
  // Usa a imagem específica do evento se existir (destaqueCountdownUrl);
  // se não houver, usa a imagem principal do evento (image);
  // como último fallback, usa a imagem global de Parallax das Configurações.
  const countdownOverlayUrl = (() => {
    const event = currentCountdownSource?.source as any | undefined;
    if (event) {
      const eventOverlay = event?.destaqueCountdownUrl;
      const eventImage = event?.image;
      return eventOverlay || eventImage || settings.parallaxBgUrl;
    }
    return settings.parallaxBgUrl;
  })();

  return (
    <div className="min-h-screen bg-jkd-bg relative">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-church-primary to-church-primary/80 py-16 overflow-hidden">
        {/* Slideshow do Destaque News */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatePresence mode="wait">
            {newsImages && newsImages.length > 0 && (
              <motion.div
                key={currentNewsIndex}
                initial={effect === 'fade' ? { opacity: 0 } : { opacity: 0, x: 40 }}
                animate={effect === 'fade' ? { opacity: 0.3 } : { opacity: 0.3, x: 0 }}
                exit={effect === 'fade' ? { opacity: 0 } : { opacity: 0, x: -40 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-center bg-cover"
                style={{ backgroundImage: `url(${newsImages[currentNewsIndex]})` }}
              />
            )}
          </AnimatePresence>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative text-center">
            <h1
              className={`text-4xl md:text-5xl font-bold mb-4 ${settings.titleGradient?.enabled ? 'text-transparent bg-clip-text animate-gradient-x' : 'text-white'}`}
              style={settings.titleGradient?.enabled ? { backgroundImage: `linear-gradient(to right, ${settings.titleGradient?.from || '#c084fc'}, ${settings.titleGradient?.via || '#ec4899'}, ${settings.titleGradient?.to || '#ef4444'})`, backgroundSize: '200% 200%', animationDuration: `${settings.titleGradient?.durationSec || 6}s` } : undefined}
            >
              Fonte News
            </h1>
            <p className="text-lg text-white opacity-90 mb-2">
              Mantenha-se conectado com as programações da nossa igreja
            </p>
            <p className="text-xl md:text-2xl font-semibold text-white opacity-95 mb-8">
              {settings.churchName}
            </p>
            
            {/* Botão removido: "Área do Líder" movido para o menu principal */}
          </div>
        </div>
      </section>

      {/* Barra abaixo do Hero/Slider: sticky abaixo do menu principal (80px altura, cor do fundo do tema) - visível apenas em desktop */}
      <div className="sticky z-30 w-full hidden lg:block" style={{ top: rightStickyTop }} aria-hidden="true">
        <svg width="100%" height="80" preserveAspectRatio="none" className="text-jkd-bg block">
          <rect x="0" y="0" width="100%" height="80" fill="currentColor" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-12">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Sidebar direita - mantém mesma largura (lg:w-1/3) */}
          <aside className="w-full lg:w-1/3 space-y-6 order-2 lg:order-2">
          {/* Conteúdo de rolagem do lado direito */}
           <div style={{ position: 'sticky', top: rightStickyTop }} className="z-40">
              {/* Barra decorativa acima do Countdown (10px, cor do fundo do tema) */}
              <div className="hidden lg:block" aria-hidden="true">
                <svg width="100%" height="2" preserveAspectRatio="none" className="text-jkd-bg block">
                  <rect x="0" y="0" width="100%" height="2" fill="currentColor" />
                </svg>
              </div>
              {(currentProgramming || nextProgramming) && (
                <div className="hidden lg:block mt-6 mb-6">
                  <Countdown 
                    targetDate={(currentProgramming || nextProgramming)!.date}
                    endDate={(currentProgramming || nextProgramming)!.endDate}
                    title={(currentProgramming || nextProgramming)!.title}
                    overlayUrl={countdownOverlayUrl}
                  />
                </div>
              )}
              {/* Fonte Live entre Countdown e MiniCalendar (desktop apenas) */}
              <div className="hidden lg:block mt-6 mb-6">
                <YouTubeLiveIndicator />
              </div>
              <div className="bg-jkd-bg-sec rounded-lg p-6 border border-jkd-border">
                <MiniCalendar events={allUpcomingItems.map(item => item.date)} />
              </div>
              <div className="bg-church-primary/10 rounded-lg p-6 border border-jkd-border mt-6">
                <h3 className="text-lg font-semibold text-jkd-heading mb-4">
                  <span className="inline-flex items-center gap-2">
                    <VGAIcon className="h-5 w-5" title="VGA" />
                    Contato da Secretaria
                  </span>
                </h3>
                <div className="space-y-3 text-sm text-jkd-text">
                  <p className="flex items-center gap-2"><Mail size={14} /> {settings.contactInfo.email}</p>
                  <p className="flex items-center gap-2"><Phone size={14} /> {settings.contactInfo.phone}</p>
                  <p className="flex items-center gap-2"><MapPin size={14} /> {settings.contactInfo.address}</p>
                  <p className="flex items-center gap-2"><Clock size={14} /> {settings.contactInfo.services}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content esquerda - mantém mesma largura (lg:w-2/3) */}
          <div className="w-full lg:w-2/3 order-1 lg:order-1 mt-0 lg:mt-0">
            {/* Conteúdo Principal apenas na coluna esquerda */}
            <div ref={leftMasterRef} className="bg-jkd-bg p-6 lg:sticky lg:top-24 z-30 mb-8">
              {/* Área esquerda do Master: botão vídeo, cards, título e busca */}
              <div>
                <div className="flex items-center gap-6 mb-8">
                  {settings.videoNewsSettings.enabled && (
                    <motion.button
                      onClick={() => toggleVideoModal(true)}
                      className="h-10 w-10 flex-shrink-0 rounded-full bg-church-primary shadow-lg flex items-center justify-center text-white relative"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Assistir Fonte News"
                    >
                      <Play size={20} className="ml-0.5" />
                      <span className="absolute h-full w-full rounded-full bg-church-primary animate-ping opacity-75"></span>
                    </motion.button>
                  )}
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-jkd-bg-sec rounded-lg p-6 border border-jkd-border">
                      <p className="text-sm font-medium text-jkd-text">Total de Avisos</p>
                      <p className="text-2xl font-bold text-jkd-heading">
                        {activeApprovedAnnouncements.filter(a => (a.type || '').trim().toLowerCase() === 'aviso').length}
                      </p>
                    </div>
                    <div className="bg-jkd-bg-sec rounded-lg p-6 border border-jkd-border">
                      <p className="text-sm font-medium text-jkd-text">Outras Programações</p>
                      <p className="text-2xl font-bold text-jkd-heading">
                        {activeApprovedAnnouncements.filter(a => (a.type || '').trim().toLowerCase() !== 'aviso').length}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Countdown somente no mobile, abaixo dos cards */}
                {(currentProgramming || nextProgramming) && (
                  <>
                    <div className="block lg:hidden mt-4 mb-[5px]">
                      <Countdown 
                        targetDate={(currentProgramming || nextProgramming)!.date}
                        endDate={(currentProgramming || nextProgramming)!.endDate}
                        title={(currentProgramming || nextProgramming)!.title}
                        overlayUrl={countdownOverlayUrl}
                      />
                    </div>
                    {/* Fonte Live abaixo do Countdown no mobile */}
                    <div className="block lg:hidden mt-4 mb-6">
                      <YouTubeLiveIndicator />
                    </div>
                  </>
                )}
                {/* Slider removido no mobile da Home (Fonte News). Exibido apenas na Home do site (/site). */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <h2 className="text-2xl font-bold text-jkd-heading">Programações Recentes</h2>
                  <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jkd-text/50" size={18} />
                      <input
                          type="text"
                          placeholder="Buscar programações..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text placeholder-jkd-text/60 focus:outline-none focus:ring-2 focus:ring-church-primary"
                      />
                  </div>
                </div>
              </div>
            </div>

            {/* Slider removido da Home (Fonte News). Agora é exibido na Home do site (/site). */}

            {/* Conteúdo de rolagem do lado esquerdo (apenas lista de programações) */}
            {/* Conteúdo Esquerda rola abaixo do Master */}
            <div style={{ position: 'sticky', top: leftStickyTop }} className="z-10">
              <div className="space-y-6">
                {filteredAndRecentAnnouncements.length > 0 ? (
                  filteredAndRecentAnnouncements.map(announcement => (
                    <AnnouncementCard 
                      key={announcement.id} 
                      announcement={announcement}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-jkd-bg-sec rounded-lg border border-jkd-border">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-jkd-text">Nenhuma programação encontrada.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default Home;
