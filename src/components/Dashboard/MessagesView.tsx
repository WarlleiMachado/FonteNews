import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { Message } from '../../types';
import { Inbox, ArrowLeft, User, MessageSquare, Reply, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessagesViewProps {
  userId: string;
  mode?: 'inbox' | 'sent';
}

const MessagesView: React.FC<MessagesViewProps> = ({ userId, mode = 'inbox' }) => {
    const { getMessagesForUser, markMessageAsRead, getAuthorizedUserById, showComposeMessage, showConfirmation, deleteMessageForUser, clearMessagesForUser } = useApp();
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    // Separar inbox (recebidas) de enviadas
    const allMessages = getMessagesForUser(userId);
    const messages = mode === 'sent'
        ? allMessages.filter(m => m.senderId === userId)
        : allMessages.filter(m => m.recipientIds.includes(userId) && m.senderId !== userId);

    const handleSelectMessage = (message: Message) => {
        setSelectedMessage(message);
        markMessageAsRead(message.id, userId);
    };

    if (selectedMessage) {
        const sender = getAuthorizedUserById(selectedMessage.senderId);
        return (
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setSelectedMessage(null)} className="inline-flex items-center gap-2 text-church-primary hover:underline">
                        <ArrowLeft size={16} /> Voltar para {mode === 'sent' ? 'Mensagens Enviadas' : 'a Caixa de Entrada'}
                    </button>
                    <div className="flex gap-2">
                    <button onClick={() => showComposeMessage(selectedMessage)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-church-primary/10 text-church-primary hover:bg-church-primary/20">
                        <Reply size={14} /> Responder
                    </button>
                    <button
                      onClick={() => showConfirmation('Excluir mensagem', 'Deseja excluir esta mensagem apenas para você?', () => deleteMessageForUser(selectedMessage.id, userId))}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
                    >
                      <Trash2 size={14} /> Excluir
                    </button>
                    </div>
                </div>
                <div className="border-b border-jkd-border pb-4 mb-4">
                    <h2 className="text-xl font-semibold text-jkd-heading">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-2 text-sm text-jkd-text mt-2">
                        <User size={14} />
                        {mode === 'sent' ? (
                          <span>Para: <strong>{getAuthorizedUserById(selectedMessage.recipientIds[0])?.name || 'Desconhecido'}</strong></span>
                        ) : (
                          <span>De: <strong>{sender?.name || 'Desconhecido'}</strong></span>
                        )}
                        <span className="text-jkd-text/50">|</span>
                        <span>{format(selectedMessage.createdAt, "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-jkd-text whitespace-pre-wrap">
                    {selectedMessage.body}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
            <div className="p-6 border-b border-jkd-border flex justify-between items-center">
                <h2 className="text-lg font-semibold text-jkd-heading">{mode === 'sent' ? 'Mensagens Enviadas' : 'Caixa de Entrada'}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => showComposeMessage()} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-church-primary text-white hover:bg-church-primary/90">
                      <MessageSquare size={16} /> Nova Mensagem
                  </button>
                  <button
                    onClick={() => showConfirmation('Esvaziar mensagens', `Deseja esvaziar todas as mensagens ${mode === 'sent' ? 'enviadas' : 'recebidas'}?`, () => clearMessagesForUser(userId, mode))}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
                  >
                    <Trash2 size={16} /> Esvaziar
                  </button>
                </div>
            </div>
            <div className="p-6">
                {messages.length > 0 ? (
                    <ul className="space-y-3">
                        {messages.map(msg => {
                            const isUnread = !msg.readBy.includes(userId);
                            const sender = getAuthorizedUserById(msg.senderId);
                            const isSentByCurrentUser = msg.senderId === userId;
                            const otherParty = isSentByCurrentUser ? getAuthorizedUserById(msg.recipientIds[0]) : sender;
                            
                            return (
                                <li key={msg.id} className={`p-4 rounded-lg border cursor-pointer transition-colors ${isUnread && !isSentByCurrentUser ? 'bg-church-primary/5 border-church-primary/20 hover:bg-church-primary/10' : 'bg-jkd-bg border-jkd-border hover:bg-jkd-border'}`}>
                                    <div className="flex justify-between items-start" onClick={() => handleSelectMessage(msg)}>
                                        <div>
                                            <p className={`font-semibold ${mode === 'inbox' && isUnread && !isSentByCurrentUser ? 'text-jkd-heading' : 'text-jkd-text'}`}>{msg.subject}</p>
                                            <p className="text-sm text-jkd-text">
                                                {mode === 'sent' ? 'Para: ' : 'De: '} 
                                                <strong>{otherParty?.name || 'Desconhecido'}</strong>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                          <p className="text-xs text-jkd-text/70 flex-shrink-0">{format(msg.createdAt, 'dd/MM/yy', { locale: ptBR })}</p>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); showConfirmation('Excluir mensagem', 'Deseja excluir esta mensagem apenas para você?', () => deleteMessageForUser(msg.id, userId)); }}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-500/10 text-red-600 hover:bg-red-500/20"
                                            title="Excluir"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="text-center py-12">
                        <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-jkd-text">Nenhuma mensagem na sua caixa de entrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesView;
