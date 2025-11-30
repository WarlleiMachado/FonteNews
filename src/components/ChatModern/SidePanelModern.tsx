import React from 'react';
import { Search, Users } from 'lucide-react';
import type { AuthorizedUser, MinistryDepartment } from '../../types';

interface SidePanelModernProps {
  users: AuthorizedUser[];
  selectedUserId: string | null;
  uiUnreadCountByUserId: Record<string, number>;
  uiUnseenByUserId: Record<string, boolean>;
  onlineUserIds: string[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  ministryDepartments: MinistryDepartment[];
  selectedGroupIds: string[];
  onToggleGroup: (id: string) => void;
  onSelectUser: (id: string) => void;
  // Novas props para UI com abas e filtros
  activeTab: 'privates' | 'groups' | 'members';
  onChangeTab: (tab: 'privates' | 'groups' | 'members') => void;
  onlineOnly: boolean;
  unreadOnly: boolean;
  onToggleOnlineOnly: () => void;
  onToggleUnreadOnly: () => void;
}

const SidePanelModern: React.FC<SidePanelModernProps> = ({
  users,
  selectedUserId,
  uiUnreadCountByUserId,
  uiUnseenByUserId,
  onlineUserIds,
  searchQuery,
  setSearchQuery,
  ministryDepartments,
  selectedGroupIds,
  onToggleGroup,
  onSelectUser,
  activeTab,
  onChangeTab,
  onlineOnly,
  unreadOnly,
  onToggleOnlineOnly,
  onToggleUnreadOnly,
}) => {
  const unreadUsersCount = users.reduce((acc, u) => acc + ((uiUnreadCountByUserId[u.id] || 0) > 0 || uiUnseenByUserId[u.id] ? 1 : 0), 0);

  return (
    <aside className="w-full lg:w-1/3 lg:border-r border-b lg:border-b-0 border-jkd-border p-4 min-w-0">
      {/* Header com título e status online */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-jkd-heading">
          <Users size={18} />
          <span>Líderes</span>
        </div>
        <div className="text-xs text-jkd-text">Online: {onlineUserIds.length}</div>
      </div>

      {/* Abas: Privadas, Grupos, Membros */}
      <div className="mb-3 flex items-center gap-2">
        <button
          className={`px-2 py-1 text-xs rounded-md border ${activeTab === 'privates' ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border text-jkd-text hover:bg-jkd-bg'}`}
          onClick={() => onChangeTab('privates')}
          title="Conversas privadas"
        >Privadas{unreadUsersCount > 0 ? ` • ${unreadUsersCount}` : ''}</button>
        <button
          className={`px-2 py-1 text-xs rounded-md border ${activeTab === 'groups' ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border text-jkd-text hover:bg-jkd-bg'}`}
          onClick={() => onChangeTab('groups')}
          title="Grupos (Ministérios / Departamentos)"
        >Grupos{ministryDepartments.length > 0 ? ` • ${ministryDepartments.length}` : ''}</button>
        <button
          className={`px-2 py-1 text-xs rounded-md border ${activeTab === 'members' ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border text-jkd-text hover:bg-jkd-bg'}`}
          onClick={() => onChangeTab('members')}
          title="Todos os membros"
        >Membros{users.length > 0 ? ` • ${users.length}` : ''}</button>
      </div>

      {/* Filtros rápidos: Online e Não lidas */}
      {(activeTab === 'privates' || activeTab === 'members') && (
        <div className="mb-2 flex items-center gap-2">
          <button
            className={`px-2 py-1 text-xs rounded-md border ${onlineOnly ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border text-jkd-text hover:bg-jkd-bg'}`}
            onClick={onToggleOnlineOnly}
            title="Somente online"
          >Online</button>
          <button
            className={`px-2 py-1 text-xs rounded-md border ${unreadOnly ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border text-jkd-text hover:bg-jkd-bg'}`}
            onClick={onToggleUnreadOnly}
            title="Somente não lidas"
          >Não lidas</button>
        </div>
      )}

      {/* Busca para privates/members */}
      {(activeTab === 'privates' || activeTab === 'members') && (
        <div className="mb-3">
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-jkd-text" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou ministério/departamento"
              className="w-full pl-7 pr-3 py-2 text-sm rounded-md bg-jkd-bg border border-jkd-border text-jkd-heading focus:outline-none focus:ring-2 focus:ring-church-primary"
            />
          </div>
        </div>
      )}

      {/* Lista de usuários (privadas/membros) */}
      {(activeTab === 'privates' || activeTab === 'members') && (
        <div className="space-y-2">
          {users.map(u => (
            <button
              key={u.id}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border transition-colors ${
                selectedUserId === u.id
                  ? 'border-church-primary bg-church-primary/10'
                  : uiUnseenByUserId[u.id]
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/30 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                    : 'border-jkd-border hover:bg-jkd-bg'
              }`}
              onClick={() => onSelectUser(u.id)}
            >
              <div className="relative">
                <img src={u.avatarUrl || '/favicon.svg'} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
                <span className={`absolute -top-1 -right-1 transition-opacity ${
                  (uiUnreadCountByUserId[u.id] > 0 || uiUnseenByUserId[u.id]) ? 'opacity-100' : 'opacity-0'
                }`}>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-church-primary opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-church-primary"></span>
                  </span>
                </span>
                <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border ${onlineUserIds.includes(u.id) ? 'bg-green-500 border-white dark:border-jkd-bg' : 'bg-gray-400 border-white dark:border-jkd-bg'}`}></span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-jkd-heading flex items-center gap-2">
                  <span className="truncate max-w-[60%] inline-block">{u.name}</span>
                  <span className={`ml-1 inline-flex items-center gap-1 rounded-md bg-church-primary text-white text-[11px] font-semibold px-2 py-0.5 transition-opacity ${
                    uiUnreadCountByUserId[u.id] > 0 ? 'opacity-100' : 'opacity-0'
                  }`} aria-label="Mensagens não vistas">
                    {uiUnreadCountByUserId[u.id] || 0}
                  </span>
                  <span className={`ml-1 inline-flex items-center rounded-md bg-church-primary/15 text-church-primary text-[11px] font-semibold px-2 py-0.5 transition-opacity ${
                    (!uiUnreadCountByUserId[u.id] && uiUnseenByUserId[u.id]) ? 'opacity-100' : 'opacity-0'
                  }`} aria-label="Nova conversa">Novo</span>
                </div>
                <div className="text-xs text-jkd-text truncate">{u.role}</div>
              </div>
            </button>
          ))}
          {users.length === 0 && (
            <div className="text-center text-sm text-jkd-text py-6">Nenhum líder ativo encontrado.</div>
          )}
        </div>
      )}

      {/* Lista de grupos (ministérios/departamentos) */}
      {activeTab === 'groups' && (
        <div className="mt-2">
          <div className="text-xs text-jkd-text mb-1">Selecionar Ministérios / Departamentos</div>
          <div className="flex flex-wrap gap-2">
            {ministryDepartments.map(g => (
              <button
                key={g.id}
                onClick={() => onToggleGroup(g.id)}
                className={`px-2 py-1 text-xs rounded-md border ${selectedGroupIds.includes(g.id) ? 'border-church-primary bg-church-primary/10 text-church-primary' : 'border-jkd-border text-jkd-text hover:bg-jkd-bg'}`}
                title={`Membros: ${(g.leaderIds || []).length}`}
              >{g.name}</button>
            ))}
          </div>
          {ministryDepartments.length === 0 && (
            <div className="text-center text-sm text-jkd-text py-6">Nenhum grupo cadastrado.</div>
          )}
        </div>
      )}
    </aside>
  );
};

export default SidePanelModern;