import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md mt-24 rounded-2xl bg-jkd-bg-sec shadow-2xl border border-jkd-border ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-jkd-heading" id="modal-title">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm text-jkd-text">
                    {message}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex justify-center rounded-md px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                onClick={onConfirm}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="inline-flex justify-center rounded-md px-4 py-2 border border-jkd-border bg-jkd-bg-sec text-sm font-medium text-jkd-text hover:bg-jkd-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary transition-colors"
                onClick={onCancel}
              >
                Cancelar
              </button>
            </div>
            <button
              onClick={onCancel}
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

export default ConfirmationModal;
