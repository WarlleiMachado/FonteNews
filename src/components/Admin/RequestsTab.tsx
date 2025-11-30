import React from 'react';
import { useApp } from '../../hooks/useApp';
import { FileText, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RequestsTab: React.FC = () => {
    const { leaderRequests, updateLeaderRequestStatus } = useApp();
    const pendingRequests = leaderRequests.filter(r => r.status === 'pending');

    return (
        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
            <div className="p-6 border-b border-jkd-border">
                <h2 className="text-lg font-semibold text-jkd-heading">Solicitações de Acesso</h2>
                <p className="text-sm text-jkd-text">Aprove ou rejeite os pedidos de novos líderes.</p>
            </div>
            <div className="p-6">
                {pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                        {pendingRequests.map(request => (
                            <div key={request.id} className="bg-jkd-bg rounded-lg border border-jkd-border p-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                                    <div>
                                        <p className="font-semibold text-jkd-heading">{request.name}</p>
                                        <p className="text-sm text-jkd-text">{request.email}</p>
                                        <p className="text-sm text-jkd-text">{request.phone}</p>
                                        <p className="text-sm text-jkd-text/80 mt-1">Ministério: <strong>{request.ministry}</strong></p>
                                    </div>
                                    <div className="mt-4 sm:mt-0 flex-shrink-0 flex flex-col items-end">
                                        <p className="text-xs text-jkd-text/70 mb-2">Recebido em: {format(request.createdAt, 'dd/MM/yy HH:mm', { locale: ptBR })}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => updateLeaderRequestStatus(request.id, 'rejected')} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50">
                                                <X size={16} /> Rejeitar
                                            </button>
                                            <button onClick={() => updateLeaderRequestStatus(request.id, 'approved')} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50">
                                                <Check size={16} /> Aprovar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-jkd-text">Nenhuma solicitação de acesso pendente.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestsTab;
