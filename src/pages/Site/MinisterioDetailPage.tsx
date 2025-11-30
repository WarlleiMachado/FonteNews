import React, { useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import AnnouncementCard from '../../components/Common/AnnouncementCard';
import VGAIcon from '../../components/Common/VGAIcon';
import Countdown from '../../components/Common/Countdown';
import { RRule } from 'rrule';

const slugify = (name?: string) => (name || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const MinisterioDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { announcements, cultos, settings, ministryDepartments, getOccurrences } = useApp();

  const ministry = useMemo(() => {
    const bySlug = ministryDepartments.find(m => (m.slug || slugify(m.name)) === slug);
    return bySlug || null;
  }, [ministryDepartments, slug]);

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

  const topCountdownOverlayUrl = (() => {
    const event = (currentProgramming || nextProgramming)?.source as any | undefined;
    if (event) {
      const eventOverlay = event?.destaqueCountdownUrl;
      const eventImage = event?.image;
      return eventOverlay || eventImage || settings.parallaxBgUrl;
    }
    return settings.parallaxBgUrl;
  })();

  const relatedAnnouncements = useMemo(() => {
    if (!ministry) return [];
    const target = ministry.name?.toLowerCase() || '';
    return approvedAnnouncements
      .filter(a => (a.ministry || '').toLowerCase() === target)
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }, [approvedAnnouncements, ministry]);

  // Logs de montagem/desmontagem, estado inicial e mudanças
  useEffect(() => {
    try {
      console.log('[Site/MinisterioDetail] mount', { slug });
      console.log('[Site/MinisterioDetail] state:init', {
        ministry: ministry ? { id: ministry.id, name: ministry.name, slug: ministry.slug } : null,
        announcementsCount: announcements.length,
        cultosCount: cultos.length,
        hasContactInfo: Boolean(settings?.contactInfo),
      });
    } catch (err) {
      console.error('[Site/MinisterioDetail] mount: error logging state', err);
    }
    return () => console.log('[Site/MinisterioDetail] unmount');
  }, []);

  useEffect(() => {
    console.log('[Site/MinisterioDetail] ministry:update', ministry ? { id: ministry.id, name: ministry.name, slug: ministry.slug } : null);
  }, [ministry]);

  useEffect(() => {
    try {
      console.log('[Site/MinisterioDetail] programming:update', { current: currentProgramming, next: nextProgramming });
    } catch (err) {
      console.error('[Site/MinisterioDetail] programming:update: error', err);
    }
  }, [currentProgramming, nextProgramming]);

  useEffect(() => {
    try {
      console.log('[Site/MinisterioDetail] relatedAnnouncements', relatedAnnouncements.map(a => ({ id: a.id, title: a.title, status: a.status })));
    } catch (err) {
      console.error('[Site/MinisterioDetail] relatedAnnouncements: error', err);
    }
  }, [relatedAnnouncements]);

  return (
    <div className="min-h-screen bg-jkd-bg">
      {/* Hero expandido com degradê configurável por ministério */}
      <div className="relative">
        {ministry?.highlightUrl && (
          <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${ministry.highlightUrl})` }} />
        )}
        {/* Degradê cobrindo todo o herói: do fundo para transparente (estilo solicitado) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to top, var(--jkd-bg-col), hsla(0, 0%, 100%, 0))',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <Link to="/site/ministerios" className="text-sm text-jkd-text hover:text-church-primary">← Voltar para Ministérios</Link>
          <h1 className="text-3xl font-bold text-jkd-heading mt-2">{ministry?.name || 'Ministério'}</h1>
          {ministry?.description && (
            <p className="text-jkd-text mt-2 max-w-3xl">{ministry.description}</p>
          )}
        </div>
      </div>

      {/* Layout inferior com duas colunas (split scroll) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna esquerda repetindo a da página de Ministérios */}
        <aside className="order-2 lg:order-1 lg:col-span-1 space-y-6">
          <div className="lg:sticky lg:top-24">
            {/* Bloco simples "Próxima Programação" igual ao da página de Ministérios */}
            <div className="bg-jkd-bg-sec rounded-lg p-4 border border-jkd-border mb-6">
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

        {/* Coluna direita maior com programações relacionadas */}
        <main className="order-1 lg:order-2 lg:col-span-2">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-bold text-jkd-heading">Conteúdos e Programações</h2>
            <div className="text-sm text-jkd-text">{relatedAnnouncements.length} resultados encontrados</div>
          </div>
          <div className="space-y-4">
            {relatedAnnouncements.map(a => (
              <AnnouncementCard key={a.id} announcement={a} showActions={false} />
            ))}
            {relatedAnnouncements.length === 0 && (
              <div className="text-sm text-jkd-text">Nenhuma programação relacionada encontrada.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MinisterioDetailPage;