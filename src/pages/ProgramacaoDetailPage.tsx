import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Link, useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, User, Play, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';

const ProgramacaoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAnnouncementById, getOccurrences, getAuthorizedUserById, toggleVideoModal } = useApp();
  const { user } = useAuth();

  const announcement = useMemo(() => (id ? getAnnouncementById(id) : undefined), [id, getAnnouncementById]);
  const nextOccurrence = useMemo(() => {
    if (!announcement) return undefined;
    return getOccurrences(announcement.rruleString, new Date(), new Date(new Date().getFullYear() + 1, 11, 31))[0];
  }, [announcement, getOccurrences]);

  const author = useMemo(() => (announcement ? getAuthorizedUserById(announcement.authorId) : undefined), [announcement, getAuthorizedUserById]);

  const getTypeInfo = (type: string | undefined) => {
    const safeType = typeof type === 'string' ? type : '';
    let label = safeType ? safeType.charAt(0).toUpperCase() + safeType.slice(1) : 'Tipo';
    let style = 'bg-church-primary/10 text-church-primary border border-church-primary/20';

    switch(safeType) {
      case 'aviso':
        label = 'Aviso';
        style = 'bg-church-slate/10 text-church-slate border border-church-slate/20';
        break;
      case 'audicao':
        label = 'Audição';
        break;
      case 'jornada-vida':
        label = 'Jornada Vida';
        break;
      case 'confraternizacao':
        label = 'Confraternização';
        break;
      case 'evento':
        label = 'Evento';
        break;
      case 'conferencia':
        label = 'Conferência';
        break;
    }
    return { label, style };
  };

  if (!announcement) {
    return (
      <div className="min-h-screen bg-jkd-bg py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/agenda" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
            <ArrowLeft size={20} />
            <span>Ir para Agenda</span>
          </Link>
          <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
            <p className="text-jkd-text">Programação não encontrada.</p>
          </div>
        </div>
      </div>
    );
  }

  const openVideo = () => {
    const url = announcement.videoUrl?.trim();
    if (!url) return;
    const isYouTube = /youtube\.com|youtu\.be/.test(url);
    toggleVideoModal(true, {
      enabled: true,
      sourceType: isYouTube ? 'youtube' : 'direct',
      url,
    });
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/agenda" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
            <ArrowLeft size={20} />
            <span>Ir para Agenda</span>
          </Link>
          <h1 className="text-3xl font-bold text-jkd-heading">{announcement.title}</h1>
          {announcement.isLive && (
            <a href="#" onClick={(e) => e.stopPropagation()} className="mt-2 inline-flex items-center rounded-full bg-red-600 text-white shadow px-2 py-0.5 text-xs font-semibold hover:bg-red-700">Transmissão Ao Vivo</a>
          )}
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-jkd-text">
            <div className="flex items-center space-x-1.5">
              <CalendarIcon size={14} className="text-church-slate" />
              <span>{nextOccurrence ? `${format(nextOccurrence, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}${announcement.endTime ? ' — ' + announcement.endTime : ''}` : 'Data a definir'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {author?.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <User size={14} className="text-church-slate" />
              )}
              <span>{announcement.author}</span>
              {announcement.ministry && (
                <span className="text-xs bg-jkd-bg px-1.5 py-0.5 rounded">{announcement.ministry}</span>
              )}
            </div>
          </div>

          {announcement.image && (
            <div className="relative">
              <img src={announcement.image} alt={announcement.title} className="w-full rounded-lg border border-jkd-border object-cover" />
              {announcement.videoUrl && (
                <button
                  type="button"
                  onClick={openVideo}
                  className="absolute top-2 left-2 inline-flex items-center justify-center w-10 h-10 rounded-md bg-red-600 text-white shadow hover:bg-red-700"
                  aria-label="Assistir vídeo"
                >
                  <Play className="h-5 w-5 animate-fade-slow" />
                </button>
              )}
            </div>
          )}

          <div>
            <div className="mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeInfo(announcement.type).style}`}>
                {getTypeInfo(announcement.type).label}
              </span>
            </div>
            {announcement.contentHtml && announcement.contentHtml.trim() ? (
              <div
                className="text-jkd-text"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(announcement.contentHtml) }}
              />
            ) : (
              <p className="text-jkd-text whitespace-pre-line">{announcement.content}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramacaoDetailPage;