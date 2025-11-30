import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Film, Plus, Filter, User } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useAuth } from '../hooks/useAuth';
import MiniCalendar from '../components/Common/MiniCalendar';
import ScriptCard from '../components/Roteiros/ScriptCard';
import { Script, ScriptStatus } from '../types';

const RoteirosPage: React.FC = () => {
    const { scripts, authorizedUsers, showConfirmation, deleteScript, showScriptView } = useApp();
    const { user: currentUser } = useAuth();
    const [statusFilter, setStatusFilter] = useState<ScriptStatus | 'all'>('all');
    const [authorFilter, setAuthorFilter] = useState<string>('all');

    const authors = useMemo(() => {
        const authorIds = new Set(scripts.map(s => s.authorId));
        return authorizedUsers.filter(u => authorIds.has(u.id));
    }, [scripts, authorizedUsers]);

    const filteredScripts = useMemo(() => {
        return scripts
            .filter(script => statusFilter === 'all' || script.status === statusFilter)
            .filter(script => authorFilter === 'all' || script.authorId === authorFilter)
            .sort((a, b) => {
                // Tratamento seguro de datas para evitar erro getTime()
                const aTime = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
                const bTime = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
                return bTime - aTime;
            });
    }, [scripts, statusFilter, authorFilter]);

    const handleDelete = (script: Script) => {
        showConfirmation(
            'Excluir Roteiro',
            `Tem certeza que deseja excluir o roteiro "${script.title}"?`,
            () => deleteScript(script.id)
        );
    };

    return (
        <div className="min-h-screen bg-jkd-bg py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <Film className="h-8 w-8 text-church-primary" />
                            <h1 className="text-3xl font-bold text-jkd-heading">Roteiros de Gravação</h1>
                        </div>
                        <Link
                            to="/new-roteiro"
                            className="h-12 w-12 rounded-full bg-church-primary text-white shadow-lg flex items-center justify-center hover:bg-church-primary/90 transition-all duration-300 transform hover:scale-110"
                            title="Novo Roteiro"
                        >
                            <Plus size={24} />
                        </Link>
                    </div>
                    <p className="text-jkd-text">
                        Gerencie os roteiros para as gravações do Fonte News.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row lg:gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-1/3 space-y-6 mb-8 lg:mb-0">
                        <div className="bg-jkd-bg-sec rounded-lg p-6 border border-jkd-border">
                            <MiniCalendar events={[]} />
                        </div>
                        <div className="bg-jkd-bg-sec rounded-lg p-6 border border-jkd-border space-y-4">
                            <h3 className="text-lg font-semibold text-jkd-heading">Filtros</h3>
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium text-jkd-heading mb-1">Status</label>
                                <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full input-style">
                                    <option value="all">Todos</option>
                                    <option value="rascunho">Rascunho</option>
                                    <option value="pronto">Pronto</option>
                                    <option value="revisado">Revisado</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="author-filter" className="block text-sm font-medium text-jkd-heading mb-1">Responsável</label>
                                <select id="author-filter" value={authorFilter} onChange={e => setAuthorFilter(e.target.value)} className="w-full input-style">
                                    <option value="all">Todos</option>
                                    {authors.map(author => (
                                        <option key={author.id} value={author.id}>{author.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="w-full lg:w-2/3">
                        {filteredScripts.length > 0 ? (
                            <div className="space-y-6">
                                {filteredScripts.map(script => (
                                    <ScriptCard 
                                        key={script.id} 
                                        script={script} 
                                        onDelete={handleDelete}
                                        onView={showScriptView}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-jkd-bg-sec rounded-lg border border-dashed border-jkd-border">
                                <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-jkd-text mb-4">Nenhum roteiro encontrado para os filtros selecionados.</p>
                                <div className="flex gap-2 justify-center">
                                    <Link to="/new-roteiro" className="inline-flex items-center space-x-2 bg-church-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-church-primary/90 transition-colors">
                                        <Plus size={20} />
                                        <span>Criar Primeiro Roteiro</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Botão flutuante movido para o topo ao lado do título */}
            <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
        </div>
    );
};

export default RoteirosPage;
