import React from 'react';
import DOMPurify from 'dompurify';
import { Link, useParams } from 'react-router-dom';
import { Calendar as CalendarIcon, Play, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApp } from '../hooks/useApp';

const CultoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { cultos, getOccurrences, toggleVideoModal } = useApp();

  const culto = cultos.find(c => c.id === id);

  if (!culto) {
    return (
      <div className="min-h-screen bg-jkd-bg py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/agenda" className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4">
            <ArrowLeft size={20} />
            <span>Ir para Agenda</span>
          </Link>
          <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
            <p className="text-jkd-text">Culto não encontrado.</p>
          </div>
        </div>
      </div>
    );
  }

  const nextOccurrences = getOccurrences(culto.rruleString, new Date(), new Date(new Date().getFullYear() + 1, 11, 31));
  const nextOccurrence = nextOccurrences[0];

  const openVideo = () => {
    const url = culto.videoUrl?.trim();
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
          <h1 className="text-3xl font-bold text-jkd-heading">{culto.title}</h1>
          {culto.isLive && (
            <a href="#" onClick={(e) => e.stopPropagation()} className="mt-2 inline-flex items-center rounded-full bg-red-600 text-white shadow px-2 py-0.5 text-xs font-semibold hover:bg-red-700">Transmissão Ao Vivo</a>
          )}
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6 space-y-6">
          <div className="flex items-center space-x-2 text-sm text-jkd-text">
            <CalendarIcon size={14} className="text-church-slate" />
            <span>{nextOccurrence ? `${format(nextOccurrence, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}${culto.endTime ? ' — ' + culto.endTime : ''}` : 'Data a definir'}</span>
          </div>

          {culto.image && (
            <div className="relative">
              <img src={culto.image} alt={culto.title} className="w-full rounded-lg border border-jkd-border object-cover" />
              {culto.videoUrl && (
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
            {culto.temaName && (
              <>
                <h2 className="text-lg font-semibold text-jkd-heading mb-2">Tema</h2>
                <span className="px-2 py-0.5 rounded-full text-xs bg-jkd-bg border border-jkd-border text-jkd-text">{culto.temaName}</span>
              </>
            )}
            {culto.descriptionHtml && culto.descriptionHtml.trim() ? (
              <div
                className="text-jkd-text mt-3"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(culto.descriptionHtml) }}
              />
            ) : (
              culto.description && (
                <p className="text-jkd-text whitespace-pre-line mt-3">{culto.description}</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CultoDetailPage;