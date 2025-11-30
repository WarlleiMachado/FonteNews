import React, { useState } from 'react';
import { Send, Inbox, Mail } from 'lucide-react';
import SendMessageForm from './SendMessageForm';
import MessagesView from '../Dashboard/MessagesView';
import { useAuth } from '../../hooks/useAuth';

type MessagingSubTab = 'send' | 'inbox' | 'sent';

const MessagingTab: React.FC = () => {
    const { user } = useAuth();
    const [activeSubTab, setActiveSubTab] = useState<MessagingSubTab>('send');

    if (!user) return null;

    const TabButton: React.FC<{ tabName: MessagingSubTab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
        <button
            onClick={() => setActiveSubTab(tabName)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeSubTab === tabName
                    ? 'border-b-2 border-church-primary text-church-primary'
                    : 'text-jkd-text hover:bg-jkd-border'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
            <div className="flex border-b border-jkd-border">
                <TabButton tabName="send" label="Enviar Mensagem" icon={<Send size={16} />} />
                <TabButton tabName="inbox" label="Caixa de Entrada" icon={<Inbox size={16} />} />
                <TabButton tabName="sent" label="Mensagens Enviadas" icon={<Mail size={16} />} />
            </div>
            
            {activeSubTab === 'send' && <SendMessageForm />}
            
            {activeSubTab === 'inbox' && (
                <div className="p-6">
                    <MessagesView userId={user.id} mode="inbox" />
                </div>
            )}
            {activeSubTab === 'sent' && (
                <div className="p-6">
                    <MessagesView userId={user.id} mode="sent" />
                </div>
            )}
        </div>
    );
};

export default MessagingTab;
