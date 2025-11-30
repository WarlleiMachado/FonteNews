import React, { useMemo, useState, useEffect } from 'react';
import { RRule } from 'rrule';
import { useApp } from '../../hooks/useApp';
import Countdown from '../../components/Common/Countdown';
import YouTubeLiveIndicator from '../../components/Common/YouTubeLiveIndicator';

import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CursosLegacySlider from '../../components/Cursos/CursosLegacySlider';

// Slider cursos está embutido via Layout; normalizadores legados não são usados aqui.
 
 
 const SiteHome: React.FC = () => {
  const WEEK_LABELS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'] as const;
  const { announcements, cultos, settings, getOccurrences } = useApp();

  const getWeekLabel = (day: number | null): string => (
    typeof day === 'number' && day >= 0 && day <= 6 ? WEEK_LABELS[day] : 'Dia não configurado'
  );

  function getMonthOccurrencesForDay(date: Date, dow: number): number[] {
    if (typeof dow !== 'number' || dow < 0 || dow > 6) return [];
    const y = date.getFullYear();
    const m = date.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const monthStart = new Date(y, m, 1);
    const delta = (dow - monthStart.getDay() + 7) % 7;
    const first = 1 + delta;
    const occ: number[] = [];
    for (let d = first; d <= daysInMonth; d += 7) occ.push(d);
    return occ;
  }

  function getWeekKeyForDate(date: Date, dow: number): '1'|'2'|'3'|'4'|'last' {
    const occ = getMonthOccurrencesForDay(date, dow);
    if (occ.length === 0) return '1';
    const targetDay = date.getDate();
    const idx = occ.indexOf(targetDay);
    if (idx >= 0) {
      return idx === occ.length - 1 ? 'last' : (String(idx + 1) as '1'|'2'|'3'|'4');
    }
    let approx = Math.floor((targetDay - occ[0]) / 7);
    approx = Math.max(0, Math.min(occ.length - 1, approx));
    return approx === occ.length - 1 ? 'last' : (String(approx + 1) as '1'|'2'|'3'|'4');
  }
  // Altura responsiva para iframe do slider externo (WP)
  const computeHeight = (w: number): number => {
    if (w > 1024) return 900;
    if (w >= 778 && w <= 1023) return 768;
    if (w >= 480 && w <= 777) return 960;
    return 720;
  };
  const [responsiveHeight, setResponsiveHeight] = useState<number>(computeHeight(typeof window !== 'undefined' ? window.innerWidth : 1024));
  useEffect(() => {
    const onResize = () => setResponsiveHeight(computeHeight(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Flag de mobile para aplicar altura dinâmica
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const onResizeMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResizeMobile);
    return () => window.removeEventListener('resize', onResizeMobile);
  }, []);

  const approvedAnnouncements = useMemo(() => announcements.filter(a => a.status === 'approved'), [announcements]);

  const allUpcomingItems = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    const announcementOccurrences = approvedAnnouncements
      .flatMap(a => getOccurrences(a.rruleString, startOfDay, nextYear).map(date => {
        let startDate = new Date(date);
        try {
          const rule = RRule.fromString(a.rruleString);
          const dtstart: Date | undefined = (rule as any).options?.dtstart;
          if (dtstart) {
            const sh = dtstart.getHours();
            const sm = dtstart.getMinutes();
            if ((sh + sm) > 0) {
              startDate.setHours(sh || 0, sm || 0, 0, 0);
            }
          }
        } catch {}
        let endDate: Date | undefined = undefined;
        if (a.endTime) {
          const [hours, minutes] = a.endTime.split(':').map(Number);
          endDate = new Date(startDate);
          endDate.setHours(hours, minutes, 0, 0);
        }
        return { title: a.title, date: startDate, endDate, source: a };
      }));

    const cultoOccurrences = cultos
      .flatMap(c => getOccurrences(c.rruleString, startOfDay, nextYear).map(date => {
        let startDate = new Date(date);
        try {
          const rule = RRule.fromString(c.rruleString);
          const dtstart: Date | undefined = (rule as any).options?.dtstart;
          if (dtstart) {
            const sh = dtstart.getHours();
            const sm = dtstart.getMinutes();
            if ((sh + sm) > 0) {
              startDate.setHours(sh || 0, sm || 0, 0, 0);
            }
          }
        } catch {}
        let endDate: Date | undefined = undefined;
        if (c.endTime) {
          const [hours, minutes] = c.endTime.split(':').map(Number);
          endDate = new Date(startDate);
          endDate.setHours(hours, minutes, 0, 0);
        }
        return { title: c.title, date: startDate, endDate, source: c };
      }));

    return [...announcementOccurrences, ...cultoOccurrences];
  }, [approvedAnnouncements, cultos, getOccurrences]);

  const nowTick = useMemo(() => Date.now(), []);

  const currentProgramming = useMemo(() => {
    const now = new Date();
    const inProgressCandidates = allUpcomingItems.filter(item => item.endDate && item.date <= now && item.endDate >= now);
    if (inProgressCandidates.length === 0) return null;
    const sorted = inProgressCandidates.sort((a, b) => (a.date as any).getTime() - (b.date as any).getTime());
    return sorted[0];
  }, [allUpcomingItems, nowTick]);

  const nextProgramming = useMemo(() => {
    const now = new Date();
    const sortedUpcoming = allUpcomingItems
      .filter(item => item.date > now)
      .sort((a, b) => (a.date as any).getTime() - (b.date as any).getTime());
    return sortedUpcoming.length > 0 ? sortedUpcoming[0] : null;
  }, [allUpcomingItems, nowTick]);

  // A coluna direita não usa overlay de imagem; apenas conteúdo transparente

  const bgUrl = settings.siteHome?.bgImageSource === 'upload'
    ? (settings.siteHome?.bgImageUploadUrl || settings.siteHome?.bgImageUrl || settings.parallaxBgUrl)
    : (settings.siteHome?.bgImageUrl || settings.parallaxBgUrl);

  const bgOpacity = typeof settings.siteHome?.bgOpacity === 'number' ? settings.siteHome.bgOpacity : 0.35;
  const bgSize = settings.siteHome?.bgSize || 'cover';
  const bgPosition = settings.siteHome?.bgPosition || 'center';
  const bgRepeat = settings.siteHome?.bgRepeat ? 'repeat' : 'no-repeat';

  // Culto-Blocos — carregar configurações do Firestore
  type CultoBlocoImage = { imageUrl?: string; imageStoragePath?: string; weekOfMonth?: '1'|'2'|'3'|'4'|'last' };
  type CultoBlocoSettingsBlock = { dayOfWeek: number | null; imageUrl?: string; imageStoragePath?: string; images?: CultoBlocoImage[]; rotationMinutes?: number };
  type CultoBlocosSettings = { blocks: CultoBlocoSettingsBlock[]; containerHeightDesktop?: number; containerHeightMobile?: number; contentHeightDesktop?: number; contentHeightMobile?: number; contentPaddingBottomDesktop?: number; contentPaddingBottomMobile?: number; clampTitleMobile?: boolean };
  const [cultoBlocosSettings, setCultoBlocosSettings] = useState<CultoBlocosSettings | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ref = doc(db, 'culto_blocos_settings', 'default');
        const snap = await getDoc(ref);
        if (snap.exists() && mounted) {
          const data = snap.data() as any;
          const blocks = Array.isArray(data.blocks) ? data.blocks : [];
          const normalized = blocks.map((b: any) => {
            const images: CultoBlocoImage[] = Array.isArray(b?.images)
              ? b.images.map((im: any) => ({
                  imageUrl: typeof im?.imageUrl === 'string' ? im.imageUrl : '',
                  imageStoragePath: typeof im?.imageStoragePath === 'string' ? im.imageStoragePath : '',
                  weekOfMonth: (im?.weekOfMonth === 'last' || ['1','2','3','4','5'].includes(String(im?.weekOfMonth))) ? (im.weekOfMonth === '5' ? 'last' : im.weekOfMonth) : undefined,
                }))
              : (typeof b?.imageUrl === 'string' && b.imageUrl
                  ? [{ imageUrl: b.imageUrl, imageStoragePath: typeof b?.imageStoragePath === 'string' ? b.imageStoragePath : '', weekOfMonth: undefined }]
                  : []);
            return {
              dayOfWeek: typeof b?.dayOfWeek === 'number' ? b.dayOfWeek : null,
              imageUrl: typeof b?.imageUrl === 'string' ? b.imageUrl : '',
              imageStoragePath: typeof b?.imageStoragePath === 'string' ? b.imageStoragePath : '',
              images,
              rotationMinutes: Number(b?.rotationMinutes ?? 0) || 0,
            } as CultoBlocoSettingsBlock;
          });
          const padded = [...normalized];
          while (padded.length < 5) padded.push({ dayOfWeek: null, imageUrl: '', imageStoragePath: '', images: [], rotationMinutes: 0 });
          const containerHeightDesktop = Number(data.containerHeightDesktop ?? data.desktopHeight ?? 400) || 400;
          const containerHeightMobile = Number(data.containerHeightMobile ?? data.mobileHeight ?? containerHeightDesktop) || containerHeightDesktop;
          const contentHeightDesktop = Number(data.contentHeightDesktop ?? 140) || 140;
          const contentHeightMobile = Number(data.contentHeightMobile ?? contentHeightDesktop) || contentHeightDesktop;
          const contentPaddingBottomDesktop = Number(data.contentPaddingBottomDesktop ?? 24) || 24;
          const contentPaddingBottomMobile = Number(data.contentPaddingBottomMobile ?? 16) || 16;
          const clampTitleMobile = Boolean(data.clampTitleMobile ?? false);
          setCultoBlocosSettings({ blocks: padded, containerHeightDesktop, containerHeightMobile, contentHeightDesktop, contentHeightMobile, contentPaddingBottomDesktop, contentPaddingBottomMobile, clampTitleMobile });
        } else if (mounted) {
          setCultoBlocosSettings({ blocks: [{ dayOfWeek: null, rotationMinutes: 0 }, { dayOfWeek: null, rotationMinutes: 0 }, { dayOfWeek: null, rotationMinutes: 0 }, { dayOfWeek: null, rotationMinutes: 0 }, { dayOfWeek: null, rotationMinutes: 0 }], containerHeightDesktop: 400, containerHeightMobile: 400, contentHeightDesktop: 140, contentHeightMobile: 120, contentPaddingBottomDesktop: 24, contentPaddingBottomMobile: 16, clampTitleMobile: false });
        }
      } catch (err) {
        console.error('Erro ao carregar culto-blocos settings', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  function resolveImageForBlock(block: CultoBlocoSettingsBlock, date?: Date | null): string | null {
    const imgs = Array.isArray(block?.images) ? block.images.filter(im => (im?.imageUrl || '').length > 0) : [];
    if (imgs.length === 0) {
      const single = (block?.imageUrl || '');
      return single || null;
    }
    if (imgs.length === 1) {
      return imgs[0].imageUrl || null;
    }
    if (!date || typeof block.dayOfWeek !== 'number') {
      return imgs[0].imageUrl || null;
    }
    const weekKey = getWeekKeyForDate(date, block.dayOfWeek);
    const exact = imgs.find(im => im.weekOfMonth === weekKey);
    if (exact?.imageUrl) return exact.imageUrl;

    // Fallback: próxima semana configurada no mês, caso não haja imagem para a semana alvo
    const occs = getMonthOccurrencesForDay(date, block.dayOfWeek);
    const total = occs.length; // 4 ou 5
    const order: ('1'|'2'|'3'|'4'|'last')[] = total === 5 ? ['1','2','3','4','last'] : ['1','2','3','4'];
    const indexOfKey = weekKey === 'last' ? order.length - 1 : (Number(weekKey) - 1);
    for (let i = indexOfKey + 1; i < order.length; i++) {
      const candidate = imgs.find(im => im.weekOfMonth === order[i]);
      if (candidate?.imageUrl) return candidate.imageUrl;
    }
    for (let i = 0; i < indexOfKey; i++) {
      const candidate = imgs.find(im => im.weekOfMonth === order[i]);
      if (candidate?.imageUrl) return candidate.imageUrl;
    }
    return imgs[0].imageUrl || null;
  }

  // Retorna todas as imagens aplicáveis para o bloco na semana alvo (ou fallback para única imagem)
  function resolveImagesForBlock(block: CultoBlocoSettingsBlock, date?: Date | null): string[] {
    const imgs = Array.isArray(block?.images) ? block.images.filter(im => (im?.imageUrl || '').length > 0) : [];
    if (imgs.length === 0) {
      const single = (block?.imageUrl || '');
      return single ? [single] : [];
    }
    if (!date || typeof block.dayOfWeek !== 'number') {
      return imgs.map(im => im.imageUrl!).filter(Boolean);
    }
    const weekKey = getWeekKeyForDate(date, block.dayOfWeek);
    const candidates = imgs.filter(im => im.weekOfMonth === weekKey).map(im => im.imageUrl!).filter(Boolean);
    if (candidates.length > 0) return candidates;
    const fallback = resolveImageForBlock(block, date);
    return fallback ? [fallback] : [];
  }

  // Define util getNextCultoForDay com declaração de função para evitar TDZ
  function getNextCultoForDay(dow: number | null) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const limit = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    if (dow == null) return null;
    const candidates: { culto: any; date: Date }[] = [];
    for (const c of cultos) {
      try {
        const dates = getOccurrences(c.rruleString, startOfDay, limit);
        for (const d of dates) {
          let startDate = new Date(d);
          try {
            const rule = RRule.fromString(c.rruleString);
            const dtstart: Date | undefined = (rule as any).options?.dtstart;
            if (dtstart) {
              const sh = dtstart.getHours();
              const sm = dtstart.getMinutes();
              if ((sh + sm) > 0) {
                startDate.setHours(sh || 0, sm || 0, 0, 0);
              }
            }
          } catch {}
          if (startDate.getDay() === dow && startDate >= now) {
            candidates.push({ culto: c, date: startDate });
          }
        }
      } catch {}
    }
    candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
    return candidates.length > 0 ? candidates[0] : null;
  }

  // Blocos de culto - contêiner full-width com 4 blocos e fundo dinâmico
  const [hoverBg, setHoverBg] = useState<string | null>(null);
  const [defaultBg, setDefaultBg] = useState<string | null>(null);
  const [activeImages, setActiveImages] = useState<string[]>([]);
  const [activeRotationMin, setActiveRotationMin] = useState<number>(0);
  const [bgA, setBgA] = useState<string | null>(null);
  const [bgB, setBgB] = useState<string | null>(null);
  const [showA, setShowA] = useState(true);
  const transitionMs = 800;

  // Define lista de imagens e estado inicial com base no bloco cujo próximo culto ocorre mais cedo
  useEffect(() => {
    const blocks = cultoBlocosSettings?.blocks ?? [];
    if (!blocks.length) {
      setActiveImages([]);
      setBgA(null);
      setBgB(null);
      return;
    }
    let closest: { block: CultoBlocoSettingsBlock; date: Date } | null = null;
    for (const block of blocks) {
      const next = getNextCultoForDay(block.dayOfWeek ?? null);
      if (next) {
        const images = resolveImagesForBlock(block, next.date);
        const img0 = images[0] || resolveImageForBlock(block, next.date) || '';
        if (!img0) continue;
        if (!closest || next.date < closest.date) {
          closest = { block, date: next.date };
        }
      }
    }
    const baseBlock = closest?.block || blocks[0];
    const nextBase = getNextCultoForDay(baseBlock.dayOfWeek ?? null);
    const images = resolveImagesForBlock(baseBlock, nextBase?.date);
    const firstImg = images[0] || resolveImageForBlock(baseBlock, nextBase?.date) || null;
    setActiveImages(images);
    setActiveRotationMin(Number(baseBlock.rotationMinutes ?? 0) || 0);
    setBgA(firstImg);
    setBgB(null);
    setShowA(true);
  }, [cultoBlocosSettings, cultos, getOccurrences]);

  // Reinicia visual ao mudar o conjunto de imagens ativo
  useEffect(() => {
    const first = activeImages[0] || null;
    setBgA(first);
    setBgB(null);
    setShowA(true);
  }, [activeImages]);

  // Alternância automática com base em activeRotationMin
  useEffect(() => {
    if ((activeRotationMin || 0) <= 0 || activeImages.length <= 1) return;
    let index = 0;
    const intervalMs = Math.max(1, activeRotationMin) * 60 * 1000;
    const timer = setInterval(() => {
      index = (index + 1) % activeImages.length;
      const nextUrl = activeImages[index];
      setShowA(prev => {
        if (prev) {
          setBgB(nextUrl);
        } else {
          setBgA(nextUrl);
        }
        return !prev;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [activeImages, activeRotationMin]);

  // Define imagem padrão com base no bloco cujo próximo culto ocorre mais cedo (mantida, mas não usada no render)
  useEffect(() => {
    const blocks = cultoBlocosSettings?.blocks ?? [];
    if (!blocks.length) {
      setDefaultBg(null);
      return;
    }
    let closest: { img: string; date: Date } | null = null;
    for (const block of blocks) {
      const next = getNextCultoForDay(block.dayOfWeek ?? null);
      if (next) {
        const img = resolveImageForBlock(block, next.date) || '';
        if (!img) continue;
        if (!closest || next.date < closest.date) {
          closest = { img, date: next.date };
        }
      }
    }
    const firstBlock = blocks[0];
    const firstNext = firstBlock ? getNextCultoForDay(firstBlock.dayOfWeek ?? null) : null;
    const firstImg = firstBlock ? (resolveImageForBlock(firstBlock, firstNext?.date) || '') : '';
    setDefaultBg(closest?.img || (firstImg || null));
  }, [cultoBlocosSettings, cultos, getOccurrences]);



  // Grid de culto-blocos: aplicar altura dinâmica
  const containerHeightPx = (() => {
    const d = cultoBlocosSettings?.containerHeightDesktop ?? 400;
    const m = cultoBlocosSettings?.containerHeightMobile ?? d;
    return isMobile ? m : d;
  })();

  const contentHeightPx = (() => {
    const d = cultoBlocosSettings?.contentHeightDesktop ?? 140;
    const m = cultoBlocosSettings?.contentHeightMobile ?? d;
    return isMobile ? m : d;
  })();

  const contentPaddingBottomPx = (() => {
    const d = cultoBlocosSettings?.contentPaddingBottomDesktop ?? 24;
    const m = cultoBlocosSettings?.contentPaddingBottomMobile ?? d;
    return isMobile ? m : d;
  })();


  const spanClass = (n: number) => {
    const map: Record<number, string> = {
      1: 'lg:col-span-1',
      2: 'lg:col-span-2',
      3: 'lg:col-span-3',
      4: 'lg:col-span-4',
      5: 'lg:col-span-5',
      6: 'lg:col-span-6',
      7: 'lg:col-span-7',
      8: 'lg:col-span-8',
      9: 'lg:col-span-9',
      10: 'lg:col-span-10',
      11: 'lg:col-span-11',
      12: 'lg:col-span-12',
    };
    return map[n] || 'lg:col-span-6';
  };

  const leftCol = settings.siteHome?.leftColSpan || 4;
  const rightCol = settings.siteHome?.rightColSpan || 8;

  // Slider de cursos é carregado no topo via Layout; removido carregamento duplicado.

  // URLs de imagens do slider são tratadas pelo embed no Layout.


  const cultBlocks = [
    {
      title: 'Celebração',
      text: 'Participe conosco em comunhão e adoração.',
      bg: '/Madu.jpeg',
    },
    {
      title: 'Intercessão',
      text: 'Momento de oração e clamor pela igreja.',
      bg: '/mural-de-oracao/assets/images/placeholders/default-prayer.jpg',
    },
    {
      title: 'Comunhão',
      text: 'Conecte-se com pessoas e fortaleça vínculos.',
      bg: '/favicon.svg',
    },
    {
      title: 'Louvor',
      text: 'Música e presença para exaltarmos ao Senhor.',
      bg: '/fonte-slider-coursx/img/arrow-right.svg',
    },
  ];

  return (
    <div className="min-h-screen bg-jkd-bg">
      {/* Fundo e overlay */}
      <div className="relative">
        {bgUrl && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: bgSize,
              backgroundPosition: bgPosition,
              backgroundRepeat: bgRepeat,
              opacity: bgOpacity,
            }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to bottom, var(--jkd-bg-col), hsla(0,0%,100%,0))',
          }}
        />

        {/* Conteúdo principal */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className={`${spanClass(leftCol)} space-y-3`}>
              <div className="text-xs text-jkd-text uppercase tracking-wide">Fonte Live...</div>
              <div className="p-0 bg-transparent">
                 <YouTubeLiveIndicator />
               </div>
            </div>
            <div className={`${spanClass(rightCol)} flex items-center gap-8`}>
              {(currentProgramming || nextProgramming) ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <div className="text-5xl md:text-6xl font-extrabold leading-none text-church-primary">{new Date().getDate()}</div>
                    <div className="text-xs md:text-sm uppercase tracking-wide text-jkd-text">{new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Countdown 
                      targetDate={(currentProgramming || nextProgramming)!.date}
                      endDate={(currentProgramming || nextProgramming)!.endDate}
                      title={(currentProgramming || nextProgramming)!.title}
                      variant="transparent"
                    />
                  </div>
                </>
              ) : (
                <div className="text-jkd-text">Nenhuma programação futura encontrada.</div>
              )}
            </div>
          </div>

          {/* Seção de cursos removida e reposicionada abaixo dos blocos de culto */}
        </div>
      </div>

      {/* Contêiner full-width com 5 blocos e fundo dinâmico */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: `${containerHeightPx}px` }}
      >
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: bgA ? `url(${bgA})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: showA ? 1 : 0,
              transition: `opacity ${transitionMs}ms ease-in-out`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: bgB ? `url(${bgB})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: showA ? 0 : 1,
              transition: `opacity ${transitionMs}ms ease-in-out`,
            }}
          />
        </div>
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        <div className="relative z-10 w-full h-full py-0">
          <div className="grid grid-cols-5 h-full">
            {(() => {
              const blocks = cultoBlocosSettings?.blocks ?? [];
              const padded = [...blocks];
              while (padded.length < 5) padded.push({ dayOfWeek: null, imageUrl: '', images: [] });
              return padded;
            })().map((block, idx) => {
              const next = getNextCultoForDay(block.dayOfWeek ?? null);
              return (
                <button
                  key={idx}
                  type="button"
                  className={`relative h-full w-full text-center min-w-0 overflow-hidden ${idx > 0 ? 'border-l' : ''} border-jkd-border group`}
                  onMouseEnter={() => {
                    const imgs = resolveImagesForBlock(block, next?.date);
                    const firstUrl = imgs[0] || resolveImageForBlock(block, next?.date) || '';
                    setActiveImages(imgs);
                    setActiveRotationMin(Number(block.rotationMinutes ?? 0) || 0);
                    setBgA(firstUrl || null);
                    setBgB(null);
                    setShowA(true);
                  }}
                  onFocus={() => {
                    const imgs = resolveImagesForBlock(block, next?.date);
                    const firstUrl = imgs[0] || resolveImageForBlock(block, next?.date) || '';
                    setActiveImages(imgs);
                    setActiveRotationMin(Number(block.rotationMinutes ?? 0) || 0);
                    setBgA(firstUrl || null);
                    setBgB(null);
                    setShowA(true);
                  }}
                  aria-label={`Bloco: ${getWeekLabel(block.dayOfWeek ?? null)}`}
                >
                  <div className="relative z-10 flex flex-col h-full w-full justify-end items-center px-2 sm:px-4 pb-4 sm:pb-6 pt-0 max-w-full space-y-1 sm:space-y-2" style={{ paddingBottom: contentPaddingBottomPx }}>
                     <div className="w-full" style={{ minHeight: contentHeightPx }}>
                       <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-white/90 text-center whitespace-normal break-words">
                       {getWeekLabel(block.dayOfWeek)}
                     </div>
                     {next ? (
                       <>
                         <div
                           className="text-sm sm:text-lg font-semibold text-white text-center whitespace-normal break-words leading-tight"
                           style={isMobile && (cultoBlocosSettings?.clampTitleMobile ?? false) ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties : undefined}
                         >
                           {next.culto.title}
                         </div>
                         <div className="text-xs sm:text-sm text-white/90 text-center">
                           {format(next.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                         </div>
                       </>
                     ) : (
                       <div className="text-xs sm:text-sm text-white/80 text-center whitespace-normal break-words leading-tight">Sem culto próximo para este dia.</div>
                     )}
                     </div>
                   </div>
                 </button>
              );
            })}
          </div>
        </div>
      </div>


      {/* Slider de cursos legado — full-width, acima do rodapé */}
      {/* Slider de cursos legado — sem bordas arredondadas na Home */}
      <CursosLegacySlider heightPx={380} noRounded />


    </div>
  );
};

export default SiteHome;

// Normalizadores movidos para topo do arquivo