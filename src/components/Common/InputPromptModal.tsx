import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface InputPromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  inputLabel: string;
  onConfirm: (inputValue: string) => void;
  onCancel: () => void;
}

const InputPromptModal: React.FC<InputPromptModalProps> = ({
  isOpen, title, message, inputLabel, onConfirm, onCancel,
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-lg bg-jkd-bg-sec shadow-xl border border-jkd-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg leading-6 font-semibold text-jkd-heading">{title}</h3>
              <p className="mt-2 text-sm text-jkd-text">{message}</p>
              <div className="mt-4">
                <label htmlFor="prompt-input" className="block text-sm font-medium text-jkd-text">{inputLabel}</label>
                <input
                  type="password"
                  id="prompt-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="mt-1 w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                  autoFocus
                />
              </div>
            </div>
            <div className="bg-jkd-bg rounded-b-lg px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-church-primary text-base font-medium text-white hover:bg-church-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                onClick={handleConfirm}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-jkd-border shadow-sm px-4 py-2 bg-jkd-bg-sec text-base font-medium text-jkd-text hover:bg-jkd-border sm:mt-0 sm:w-auto sm:text-sm transition-colors"
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

export default InputPromptModal;
