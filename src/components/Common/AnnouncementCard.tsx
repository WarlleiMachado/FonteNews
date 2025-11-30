import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, Edit, Trash2, Check, X, ZoomIn, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { Announcement, AnnouncementType } from '../../types';
import ImageModal from './ImageModal';

interface AnnouncementCardProps {
  announcement: Announcement;
  showActions?: boolean;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (id: string) => void;
  showApprovalActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  inProgress?: boolean;
  variant?: 'default' | 'light';
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ 
  announcement, 
  showActions = false,
  onEdit,
  onDelete,
  showApprovalActions = false,
  onApprove,
  onReject,
  inProgress = false,
  variant = 'default'
}) => {
  const { getOccurrences, getAuthorizedUserById, toggleVideoModal } = useApp();
  const { user } = useAuth();
  const nextOccurrence = getOccurrences(announcement.rruleString, new Date(), new Date(new Date().getFullYear() + 1, 11, 31))[0];
  const author = getAuthorizedUserById(announcement.authorId);
  const isLight = variant === 'light';

  const getTypeInfo = (type: AnnouncementType) => {
    const safeType = typeof type === 'string' ? type : '';
    let label = safeType ? safeType.charAt(0).toUpperCase() + safeType.slice(1) : 'Tipo';
    let style = 'bg-church-primary/10 text-church-primary border border-church-primary/20';

    switch(type) {
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
    }
    
    return { label, style };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-500/30';
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30';
      case 'baixa': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-500/30';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusPill = (status: Announcement['status']) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1"><Check size={12}/> Aprovado</span>;
      case 'pending': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1"><Clock size={12}/> Pendente</span>;
      case 'rejected': return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-center gap-1"><X size={12}/> Rejeitado</span>;
    }
  };

  const typeInfo = getTypeInfo(announcement.type);

  const [showImageModal, setShowImageModal] = useState(false);

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
    <motion.div 
      className={`bg-jkd-bg-sec rounded-lg shadow-sm border ${isLight ? 'relative overflow-hidden group' : 'overflow-hidden'} transition-all duration-300 ${inProgress ? 'border-green-500 shadow-green-200/50' : 'border-jkd-border hover:shadow-lg hover:border-church-primary/30'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
    >
      {isLight && announcement.image && (
        <img 
          src={announcement.image} 
          alt={announcement.title}
          className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none" 
        />
      )}
      {isLight && (
        <Link 
          to={`/programacao/${announcement.id}`}
          aria-label="Ver Programação"
          className="absolute inset-0 z-10 block group-hover:hidden"
        />
      )}
      {isLight && announcement.videoUrl && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openVideo(); }}
          className="absolute top-2 right-2 z-20 inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-600 text-white shadow hover:bg-red-700 opacity-100 group-hover:opacity-0 transition-opacity"
          aria-label="Assistir vídeo"
        >
          <Play className="h-4 w-4 animate-fade-slow" />
        </button>
      )}
      <div className="flex flex-col md:flex-row">
        {/* Main Content */}
        <div className={`p-6 flex-grow ${isLight ? 'relative z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100' : ''}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.style}`}>
                  {typeInfo.label}
                </span>
                {user && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                    Prioridade {announcement.priority}
                  </span>
                )}
                {showActions && getStatusPill(announcement.status)}
                {inProgress && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                    <Play size={12} /> Em andamento
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-jkd-heading mb-2 flex items-center gap-2">
                <Link to={`/programacao/${announcement.id}`} className="hover:text-church-primary">
                  {announcement.title}
                </Link>
                {announcement.isLive && (
                  <a href="#" onClick={(e) => e.stopPropagation()} aria-label="Transmissão ao vivo" className="inline-flex items-center rounded-full bg-red-600 text-white shadow px-2 py-0.5 text-xs font-semibold hover:bg-red-700">Transmissão Ao Vivo</a>
                )}
              </h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {!isLight && (announcement as any)?.temaName && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-jkd-bg border border-jkd-border text-jkd-text">Tema: {(announcement as any).temaName}</span>
                )}
                {!isLight && (announcement as any)?.topicoName && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-jkd-bg border border-jkd-border text-jkd-text">Tópico: {(announcement as any).topicoName}</span>
                )}
              </div>
            </div>
            
            {showActions && !showApprovalActions && (
              <div className="flex space-x-1">
                <button
                  onClick={() => onEdit?.(announcement)}
                  className="p-2 rounded-md text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors"
                  aria-label="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete?.(announcement.id)}
                  className="p-2 rounded-md text-jkd-text hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  aria-label="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <Link to={`/programacao/${announcement.id}`} className="block">
            <p className={`text-jkd-text mb-4 leading-relaxed ${isLight ? 'line-clamp-2' : 'line-clamp-3'} break-anywhere cursor-pointer hover:text-church-primary`}>{announcement.content}</p>
          </Link>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-jkd-text">
            <div className="flex items-center space-x-1.5">
              <Calendar size={14} className="text-church-slate" />
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
                <span className="text-xs bg-jkd-bg px-1.5 py-0.5 rounded">
                  {announcement.ministry}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Image Section (omit in Light variant because background covers whole card) */}
        {!isLight && announcement.image && (
          <div className="md:w-1/4 flex-shrink-0 relative group cursor-zoom-in" onClick={() => setShowImageModal(true)}>
            <img 
              src={announcement.image} 
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center rounded-full bg-white/90 text-jkd-heading shadow px-2 py-1 text-xs font-medium">
                <ZoomIn className="h-3.5 w-3.5 mr-1" />
                Expandir
              </span>
            </div>
              {announcement.videoUrl && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); openVideo(); }}
                className="absolute top-2 left-2 inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-600 text-white shadow hover:bg-red-700"
                aria-label="Assistir vídeo"
              >
                <Play className="h-4 w-4 animate-fade-slow" />
              </button>
              )}
            {inProgress && (
              <div className="absolute bottom-2 left-2">
                <span className="inline-flex items-center rounded-full bg-green-600 text-white shadow px-2 py-1 text-xs font-medium">
                  <Play className="h-3.5 w-3.5 mr-1" /> Em andamento
                </span>
              </div>
            )}
          </div>
        )}
        {isLight && inProgress && (
          <div className="absolute bottom-2 left-2 group-hover:hidden">
            <span className="inline-flex items-center rounded-full bg-green-600 text-white shadow px-2 py-1 text-xs font-medium">
              <Play className="h-3.5 w-3.5 mr-1" /> Em andamento
            </span>
          </div>
        )}
      </div>

      {/* Approval Actions */}
      {showApprovalActions && (
        <div className="p-4 border-t border-jkd-border flex justify-end space-x-3 bg-jkd-bg">
            <button
              onClick={() => onReject?.(announcement.id)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
            >
              <X size={16} />
              <span>Rejeitar</span>
            </button>
            <button
              onClick={() => onApprove?.(announcement.id)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 transition-colors"
            >
              <Check size={16} />
              <span>Aprovar</span>
            </button>
        </div>
      )}
  {showImageModal && announcement.image && (
    <ImageModal src={announcement.image} alt={announcement.title} onClose={() => setShowImageModal(false)} />
  )}
    </motion.div>
  );
};

export default AnnouncementCard;
