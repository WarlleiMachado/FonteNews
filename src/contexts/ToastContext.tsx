import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

type Toast = { id: string; type: 'info' | 'success' | 'error' | 'warning'; message: string };

interface ToastContextValue {
  showToast: (type: Toast['type'], message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = crypto.randomUUID();
    const t: Toast = { id, type, message };
    setToasts(prev => [...prev, t]);
    // Auto-remove after 5s
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(x => x.id !== id));
  }, []);

  const variant = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          classes: 'bg-green-600 ring-1 ring-green-300/30',
          icon: <CheckCircle className="h-5 w-5 text-white" />
        };
      case 'error':
        return {
          classes: 'bg-red-600 ring-1 ring-red-300/30',
          icon: <AlertTriangle className="h-5 w-5 text-white" />
        };
      case 'warning':
        return {
          classes: 'bg-amber-500 ring-1 ring-amber-300/30',
          icon: <AlertTriangle className="h-5 w-5 text-white" />
        };
      default:
        return {
          classes: 'bg-church-primary ring-1 ring-white/20',
          icon: <Info className="h-5 w-5 text-white" />
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div id="__app_toast_container" aria-live="polite" className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map(t => {
            const v = variant(t.type);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className={`min-w-[260px] max-w-[360px] text-white rounded-xl shadow-2xl ${v.classes}`}
              >
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    {v.icon}
                  </div>
                  <div className="flex-1 text-sm leading-snug">
                    {t.message}
                  </div>
                  <button
                    className="p-1 rounded-md/80 hover:bg-white/10 transition-colors"
                    aria-label="Fechar aviso"
                    onClick={() => dismissToast(t.id)}
                  >
                    <X className="h-4 w-4 text-white/80" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastContext;
