import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import AnnouncementCard from '../../components/Common/AnnouncementCard';
import VGAIcon from '../../components/Common/VGAIcon';
import { RRule } from 'rrule';

const slugify = (name?: string) => (name || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const MinisteriosPage: React.FC = () => {
  const { announcements, cultos, settings, ministryDepartments, getOccurrences } = useApp();

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

  // Somente ministérios/ departamentos visíveis (active !== false) e ordenados
  const visibleMinistryDepartments = useMemo(() => {
    return ministryDepartments
      .filter((m) => m.active !== false)
      .sort((a, b) => {
        const ao = a.order ?? 999;
        const bo = b.order ?? 999;
        if (ao !== bo) return ao - bo;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [ministryDepartments]);

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

  // Overlay não é mais necessário para o bloco simples de próxima programação

  const recentAnnouncements = useMemo(() => {
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
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 3);
  }, [approvedAnnouncements, getOccurrences, nowTick]);

  // Logs de montagem/desmontagem e estado inicial
  useEffect(() => {
    try {
      console.log('[Site/Ministerios] mount');
      console.log('[Site/Ministerios] state:init', {
        deptCount: ministryDepartments.length,
        announcementsCount: announcements.length,
        cultosCount: cultos.length,
        hasParallaxBg: Boolean(settings.parallaxBgUrl),
      });
    } catch (err) {
      console.error('[Site/Ministerios] mount: error logging state', err);
    }
    return () => console.log('[Site/Ministerios] unmount');
  }, []);

  // Log quando departamentos mudam
  useEffect(() => {
    try {
      console.log('[Site/Ministerios] departments:update', ministryDepartments.map(m => ({ id: m.id, name: m.name, slug: m.slug })));
    } catch (err) {
      console.error('[Site/Ministerios] departments:update: error', err);
    }
  }, [ministryDepartments]);

  // Log de programações corrente/próxima
  useEffect(() => {
    try {
      console.log('[Site/Ministerios] programming:update', { current: currentProgramming, next: nextProgramming });
    } catch (err) {
      console.error('[Site/Ministerios] programming:update: error', err);
    }
  }, [currentProgramming, nextProgramming]);

  // Log de programações recentes
  useEffect(() => {
    try {
      console.log('[Site/Ministerios] recentAnnouncements', recentAnnouncements.map(a => ({ id: a.id, title: a.title, status: a.status })));
    } catch (err) {
      console.error('[Site/Ministerios] recentAnnouncements: error', err);
    }
  }, [recentAnnouncements]);

  return (
    <div className="min-h-screen bg-jkd-bg">
      {/* Topo de largura total com título e descrição */}
      <div className="relative">
        {/* Fundo parallax opcional */}
        {settings.parallaxBgUrl && (
          <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${settings.parallaxBgUrl})`, opacity: 0.25 }} />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-jkd-heading">Ministérios</h1>
          <p className="text-jkd-text mt-2 max-w-3xl">
            Conheça os ministérios e departamentos da igreja. Clique em um bloco para ver detalhes, agenda e conteúdos relacionados.
          </p>
        </div>
        {/* Barra de separação suave para efeito de degradação */}
        <svg width="100%" height="40" preserveAspectRatio="none" className="text-jkd-bg block">
          <rect x="0" y="0" width="100%" height="40" fill="currentColor" />
        </svg>
      </div>

      {/* Container inferior com layout split/dual scrolling */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna esquerda (menor) */}
        <aside className="order-2 lg:order-1 lg:col-span-1 space-y-6">
          <div className="lg:sticky lg:top-24">
            {/* Bloco simples "Próxima Programação" com overlay igual ao bloco Secretaria */}
            <div className="bg-church-primary/10 rounded-lg p-4 border border-jkd-border mb-6">
              <h3 className="text-lg font-semibold text-jkd-heading mb-4">Próxima Programação</h3>
              { (currentProgramming || nextProgramming) ? (
                <div className="space-y-2">
                  <p className="text-sm text-jkd-text" title={(currentProgramming || nextProgramming)!.title}>
                    {(currentProgramming || nextProgramming)!.title}
                  </p>
                  <p className="text-xs text-jkd-text/80">
                    {((currentProgramming || nextProgramming)!.date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {currentProgramming && (
                    <span className="inline-block text-xs px-2 py-1 rounded bg-church-primary text-white">Em andamento</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-jkd-text">Nenhuma programação próxima.</p>
              )}
            </div>
            <div className="bg-jkd-bg-sec rounded-lg p-4 border border-jkd-border">
              <h3 className="text-lg font-semibold text-jkd-heading mb-4">Programações Recentes</h3>
              <div className="space-y-4">
                {recentAnnouncements.map(a => (
                  <AnnouncementCard key={a.id} announcement={a} showActions={false} variant="light" />
                ))}
                {recentAnnouncements.length === 0 && (
                  <p className="text-sm text-jkd-text">Nenhuma programação recente.</p>
                )}
              </div>
            </div>
            <div className="bg-church-primary/10 rounded-lg p-4 border border-jkd-border">
              <h3 className="text-lg font-semibold text-jkd-heading mb-4">
                <span className="inline-flex items-center gap-2">
                  <VGAIcon className="h-5 w-5" title="VGA" />
                  Contato da Secretaria
                </span>
              </h3>
              <div className="space-y-3 text-sm text-jkd-text">
                <p>Email: {settings.contactInfo.email}</p>
                <p>Telefone: {settings.contactInfo.phone}</p>
                <p>Endereço: {settings.contactInfo.address}</p>
                <p>Atendimento: {settings.contactInfo.services}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Coluna direita (maior) com blocos de ministérios */}
        <main className="order-1 lg:order-2 lg:col-span-2">
          <div className="space-y-6">
            {visibleMinistryDepartments.map((m) => {
              const slug = m.slug || slugify(m.name);
              return (
                <Link to={`/site/ministerios/${slug}`} key={m.id} className="block rounded-lg border border-jkd-border bg-jkd-bg-sec hover:bg-jkd-bg transition-colors">
                  <div className="p-4 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-12 md:col-span-9 flex items-start gap-4">
                      {m.logoUrl && (
                        <img src={m.logoUrl} alt={m.name} className="h-10 w-10 rounded bg-white border border-jkd-border object-contain" />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-jkd-heading">{m.name}</h3>
                        {m.description && (
                          <p className="text-jkd-text mt-1 line-clamp-3">{m.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-3">
                      <div className="aspect-square rounded-lg overflow-hidden border border-jkd-border">
                        {m.highlightUrl ? (
                          <img src={m.highlightUrl} alt={m.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-jkd-bg flex items-center justify-center text-jkd-text/60">Sem imagem</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {visibleMinistryDepartments.length === 0 && (
              <div className="text-sm text-jkd-text">Nenhum ministério/departamento cadastrado.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MinisteriosPage;