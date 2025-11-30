import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { Message } from '../../types';

interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: Message;
}

const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  isOpen,
  onClose,
  replyTo,
}) => {
  const { addMessage, authorizedUsers } = useApp();
  const { user: currentUser } = useAuth();

  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSent, setIsSent] = useState(false);

  const admins = useMemo(() => authorizedUsers.filter(u => u.role === 'admin'), [authorizedUsers]);

  useEffect(() => {
    if (isOpen) {
      setIsSent(false);
      if (replyTo) {
        setRecipientId(replyTo.senderId);
        setSubject(replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`);
        setBody(`\n\n--- Em ${replyTo.createdAt.toLocaleString()}, ${authorizedUsers.find(u => u.id === replyTo.senderId)?.name} escreveu: ---\n${replyTo.body}`);
      } else {
        setRecipientId(admins.length > 0 ? admins[0].id : '');
        setSubject('');
        setBody('');
      }
    }
  }, [isOpen, replyTo, admins, authorizedUsers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !recipientId || !subject || !body) return;

    addMessage({
      senderId: currentUser.id,
      recipientIds: [recipientId],
      subject,
      body,
    });

    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl rounded-lg bg-jkd-bg-sec shadow-xl border border-jkd-border"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <h3 className="text-lg leading-6 font-semibold text-jkd-heading">
                  {replyTo ? 'Responder Mensagem' : 'Nova Mensagem'}
                </h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-jkd-heading mb-1">Para:</label>
                    <select
                      id="recipient"
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      required
                      className="w-full input-style"
                      disabled={!!replyTo}
                    >
                      {admins.map(admin => (
                        <option key={admin.id} value={admin.id}>{admin.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-jkd-heading mb-1">Assunto:</label>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full input-style"
                    />
                  </div>
                  <div>
                    <label htmlFor="body" className="block text-sm font-medium text-jkd-heading mb-1">Mensagem:</label>
                    <textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                      rows={8}
                      className="w-full input-style"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-jkd-bg rounded-b-lg px-6 py-4 flex flex-row-reverse items-center gap-4">
                <button
                  type="submit"
                  disabled={isSent}
                  className="inline-flex justify-center items-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-church-primary text-base font-medium text-white hover:bg-church-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-primary sm:text-sm transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                  {isSent ? 'Enviada!' : 'Enviar'}
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-jkd-border shadow-sm px-4 py-2 bg-jkd-bg-sec text-base font-medium text-jkd-text hover:bg-jkd-border sm:text-sm transition-colors"
                  onClick={onClose}
                >
                  Cancelar
                </button>
              </div>
            </form>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-full text-jkd-text/50 hover:bg-jkd-border hover:text-jkd-text transition-colors"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComposeMessageModal;
