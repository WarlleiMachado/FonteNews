import React from 'react';
import { Script, ScriptStatus } from '../../types';
import { useApp } from '../../hooks/useApp';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Edit, Trash2, Download, Eye, FileText, CheckCircle, Edit3, Film } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ScriptCardProps {
  script: Script;
  onDelete: (script: Script) => void;
  onView: (script: Script) => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ script, onDelete, onView }) => {
  const { getOccurrences, getAuthorizedUserById } = useApp();
  const author = getAuthorizedUserById(script.authorId);
  const lastEditor = getAuthorizedUserById(script.history[script.history.length - 1]?.userId);
  const nextOccurrence = getOccurrences(script.rruleString, new Date(), new Date(new Date().getFullYear() + 1, 11, 31))[0];

  const getStatusInfo = (status: ScriptStatus) => {
    switch (status) {
      case 'rascunho': return { text: 'Rascunho', icon: <Edit3 size={12} />, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
      case 'pronto': return { text: 'Pronto', icon: <FileText size={12} />, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
      case 'revisado': return { text: 'Revisado', icon: <CheckCircle size={12} />, color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
      default: return { text: 'Rascunho', icon: <Edit3 size={12} />, color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
  };

  const statusInfo = getStatusInfo(script.status);

  const handleDownload = () => {
    const blob = new Blob([script.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${script.title.replace(/ /g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="bg-jkd-bg-sec rounded-lg shadow-sm border border-jkd-border overflow-hidden hover:shadow-md transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-jkd-heading mb-2">{script.title}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-jkd-text">
              <div className="flex items-center gap-1.5" title="Data da Programação">
                <Calendar size={14} className="text-church-slate" />
                <span>{nextOccurrence ? format(nextOccurrence, "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : 'Data a definir'}</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.icon}
                <span>{statusInfo.text}</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            {script.image ? (
                <img src={script.image} alt={script.title} className="h-10 w-10 object-cover rounded-md" />
            ) : (
                <div className="h-10 w-10 bg-jkd-bg rounded-md flex items-center justify-center border border-jkd-border text-church-primary">
                    <Film size={20}/>
                </div>
            )}
          </div>
        </div>

        <p className="text-jkd-text mb-4 leading-relaxed line-clamp-2">{script.content || 'Nenhum conteúdo adicionado.'}</p>
        
        <div className="text-xs text-jkd-text/70 space-y-1">
            <div className="flex items-center gap-1.5"><User size={12} /><span>Autor: {author?.name || 'Desconhecido'}</span></div>
            <div className="flex items-center gap-1.5"><Clock size={12} /><span>Última edição: {format(script.updatedAt, 'dd/MM/yy HH:mm')} por {lastEditor?.name || 'Sistema'}</span></div>
             <div className="flex items-center gap-1.5 font-semibold"><Calendar size={12} /><span>Gravação: {script.recordingMonth}</span></div>
        </div>
      </div>
      <div className="bg-jkd-bg border-t border-jkd-border px-6 py-3 flex justify-end items-center gap-2">
        <button onClick={() => onView(script)} title="Visualizar" className="action-button"><Eye size={16} /></button>
        <button onClick={handleDownload} title="Baixar" className="action-button"><Download size={16} /></button>
        <Link to={`/edit-roteiro/${script.id}`} title="Editar" className="action-button"><Edit size={16} /></Link>
        <button onClick={() => onDelete(script)} title="Excluir" className="action-button text-red-500 hover:bg-red-500/10"><Trash2 size={16} /></button>
      </div>
      <style>{`.action-button { @apply p-2 rounded-md text-jkd-text hover:bg-church-primary/10 hover:text-church-primary transition-colors; }`}</style>
    </motion.div>
  );
};

export default ScriptCard;
