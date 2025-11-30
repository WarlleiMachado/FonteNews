import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar } from 'lucide-react';
import { Script } from '../../types';
import { useApp } from '../../hooks/useApp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ScriptViewModalProps {
  isOpen: boolean;
  script: Script | null;
  onClose: () => void;
}

const ScriptViewModal: React.FC<ScriptViewModalProps> = ({ isOpen, script, onClose }) => {
  const { getAuthorizedUserById } = useApp();
  
  if (!script) return null;

  const author = getAuthorizedUserById(script.authorId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg bg-jkd-bg-sec shadow-xl border border-jkd-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-jkd-border">
              <h3 className="text-xl leading-6 font-semibold text-jkd-heading">{script.title}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-jkd-text/80">
                <div className="flex items-center gap-1.5"><User size={14}/><span>{author?.name || 'Desconhecido'}</span></div>
                <div className="flex items-center gap-1.5"><Calendar size={14}/><span>{format(script.createdAt, "dd/MM/yyyy", { locale: ptBR })}</span></div>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none text-jkd-text whitespace-pre-wrap">
                {script.content}
              </div>
            </div>
            
            <div className="bg-jkd-bg rounded-b-lg px-6 py-4 border-t border-jkd-border flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-jkd-border shadow-sm px-4 py-2 bg-jkd-bg-sec text-base font-medium text-jkd-text hover:bg-jkd-border sm:w-auto sm:text-sm transition-colors"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full text-jkd-text/50 hover:bg-jkd-border hover:text-jkd-text transition-colors"
              aria-label="Fechar"
            >
                <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScriptViewModal;
