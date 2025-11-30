import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { Send, Search, Check, Minus } from 'lucide-react';

const SendMessageForm: React.FC = () => {
    const { authorizedUsers, ministryDepartments, addMessage, onlineUserIds } = useApp();
    const { user: adminUser } = useAuth();
    const [recipients, setRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const leaders = useMemo(() => authorizedUsers.filter(u => u.role !== 'admin'), [authorizedUsers]);

    const filteredLeaders = useMemo(() => {
        if (!searchTerm) return leaders;
        return leaders.filter(leader =>
            leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            leader.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [leaders, searchTerm]);

    const handleRecipientToggle = (id: string) => {
        setRecipients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return Array.from(newSet);
        });
    };
    
    const handleGroupToggle = (groupId: string) => {
        const group = ministryDepartments.find(g => g.id === groupId);
        if (!group || group.leaderIds.length === 0) return;

        const groupMemberIds = new Set(group.leaderIds);
        const currentRecipients = new Set(recipients);
        
        const areAllSelected = group.leaderIds.every(id => currentRecipients.has(id));

        if (areAllSelected) {
            groupMemberIds.forEach(id => currentRecipients.delete(id));
        } else {
            groupMemberIds.forEach(id => currentRecipients.add(id));
        }
        setRecipients(Array.from(currentRecipients));
    };

    const handleSelectAllVisible = () => {
        const allVisibleLeaderIds = new Set(filteredLeaders.map(l => l.id));
        const currentRecipients = new Set(recipients);

        const areAllVisibleSelected = filteredLeaders.every(l => currentRecipients.has(l.id));

        if (areAllVisibleSelected && filteredLeaders.length > 0) {
            allVisibleLeaderIds.forEach(id => currentRecipients.delete(id));
        } else {
            allVisibleLeaderIds.forEach(id => currentRecipients.add(id));
        }
        setRecipients(Array.from(currentRecipients));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminUser || recipients.length === 0 || !subject || !body) return;

        addMessage({
            senderId: adminUser.id,
            recipientIds: recipients,
            subject,
            body,
        });
        showToast('success', 'Mensagem enviada com sucesso!');
        setRecipients([]);
        setSubject('');
        setBody('');
    };
    
    const allVisibleSelected = useMemo(() => {
        if (filteredLeaders.length === 0) return false;
        return filteredLeaders.every(l => recipients.includes(l.id));
    }, [filteredLeaders, recipients]);

    const getStatusInfo = (status: 'active' | 'blocked' | 'inactive') => {
        switch (status) {
            case 'active': return { text: 'Ativo', color: 'text-green-600' };
            case 'blocked': return { text: 'Bloqueado', color: 'text-red-600' };
            case 'inactive': return { text: 'Inativo', color: 'text-gray-500' };
            default: return { text: 'Ativo', color: 'text-green-600' };
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-jkd-heading mb-2">Destinatários</label>
                <div className="bg-jkd-bg border border-jkd-border rounded-lg p-4 space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-jkd-heading mb-2">Ministérios / Departamentos</h4>
                        <div className="space-y-2">
                            {ministryDepartments.map(group => {
                                const groupMembersInRecipients = group.leaderIds.filter(id => recipients.includes(id));
                                const isAllSelected = group.leaderIds.length > 0 && groupMembersInRecipients.length === group.leaderIds.length;
                                const isPartiallySelected = groupMembersInRecipients.length > 0 && !isAllSelected;

                                return (
                                    <div key={group.id} className="flex items-center">
                                        <button type="button" onClick={() => handleGroupToggle(group.id)} className="flex items-center gap-3 cursor-pointer">
                                            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${isAllSelected || isPartiallySelected ? 'bg-church-primary border-church-primary' : 'border-jkd-border bg-jkd-bg'}`}>
                                                {isAllSelected && <Check size={14} className="text-white" />}
                                                {isPartiallySelected && <Minus size={14} className="text-white" />}
                                            </div>
                                            <span className="text-sm text-jkd-text">{group.name} <span className="text-xs text-jkd-text/70">({group.leaderIds.length})</span></span>
                                        </button>
                                    </div>
                                );
                            })}
                            {ministryDepartments.length === 0 && <p className="text-xs text-jkd-text/70">Nenhum grupo criado. Crie na aba 'Líderes'.</p>}
                        </div>
                    </div>
                    <div className="border-t border-jkd-border pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-jkd-heading">Líderes Individuais</h4>
                            <button type="button" onClick={handleSelectAllVisible} className="text-sm font-medium text-church-primary hover:underline">
                                {allVisibleSelected ? 'Desselecionar Todos' : 'Selecionar Todos'}
                            </button>
                        </div>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jkd-text/50" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar líder por nome ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 border border-jkd-border rounded-md bg-jkd-bg-sec text-jkd-text text-sm focus:outline-none focus:ring-1 focus:ring-church-primary"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                            {filteredLeaders.map(leader => {
                                const isOnline = onlineUserIds.includes(leader.id);
                                const statusInfo = getStatusInfo(leader.status);
                                return (
                                    <div key={leader.id} className="flex items-center">
                                        <input type="checkbox" id={`recipient-${leader.id}`} checked={recipients.includes(leader.id)} onChange={() => handleRecipientToggle(leader.id)} className="h-4 w-4 rounded border-gray-300 text-church-primary focus:ring-church-primary"/>
                                        <label htmlFor={`recipient-${leader.id}`} className="ml-3 flex items-center gap-2 text-sm text-jkd-text">
                                            <span>{leader.name}</span>
                                            <span className={`text-xs font-medium ${statusInfo.color}`}>({statusInfo.text})</span>
                                            <span title={isOnline ? 'Online' : 'Offline'} className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="text-right text-sm text-jkd-text pt-2 border-t border-jkd-border">
                        Total: {recipients.length} destinatário(s)
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-jkd-heading mb-2">Assunto *</label>
                <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full input-style" />
            </div>
            <div>
                <label htmlFor="body" className="block text-sm font-medium text-jkd-heading mb-2">Mensagem *</label>
                <textarea id="body" value={body} onChange={e => setBody(e.target.value)} required rows={6} className="w-full input-style" />
            </div>

            {/* Notificação inline removida; usamos toast flutuante para feedback */}

            <div className="flex justify-end">
                <button type="submit" disabled={recipients.length === 0 || !subject || !body} className="inline-flex items-center space-x-2 bg-church-primary text-white px-6 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-50">
                    <Send size={16} />
                    <span>Enviar Mensagem</span>
                </button>
            </div>
            <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
        </form>
    );
};

export default SendMessageForm;
