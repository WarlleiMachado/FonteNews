import React, { useMemo, useState } from 'react';
import Avatar from './ui/Avatar';
import { AuthorizedUser, MinistryDepartment } from '../../../types';
import { cn } from '../lib/utils';

interface SidePanelProps {
  users: AuthorizedUser[];
  groups: MinistryDepartment[];
  currentUserId?: string | null;
  selectedUserId?: string | null;
  selectedGroupId?: string | null;
  onlineUserIds?: string[];
  unreadCountByUserId?: Record<string, number>;
  unreadCountByGroupId?: Record<string, number>;
  onSelectUser: (userId: string) => void;
  onSelectGroup: (groupId: string) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ users, groups, currentUserId, selectedUserId, selectedGroupId, onlineUserIds = [], unreadCountByUserId = {}, unreadCountByGroupId = {}, onSelectUser, onSelectGroup }) => {
  const [activeTab, setActiveTab] = useState<'leaders' | 'departments' | 'members'>('leaders');
  const [query, setQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const base = users.filter(u => u.id !== currentUserId);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(u => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, currentUserId, query]);

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups.filter(g => (g.name || '').toLowerCase().includes(q));
  }, [groups, query]);

  const membersPlaceholder = useMemo(() => {
    switch (activeTab) {
      case 'leaders':
        return 'Pesquisar líderes...';
      case 'departments':
        return 'Pesquisar ministérios ou departamentos...';
      case 'members':
        return 'Pesquisar membros ou ministérios...';
      default:
        return 'Pesquisar...';
    }
  }, [activeTab]);

  const countActiveLeaders = (g: MinistryDepartment) => {
    const ids = (g.leaderIds || []) as string[];
    return ids.filter(id => {
      const u = users.find(x => x.id === id) as any;
      const status = u?.status;
      return !u ? false : !status || status === 'active' || status === 'approved';
    }).length;
  };

  return (
    <aside className="w-full sm:w-80 border-r border-jkd-border bg-light-bg dark:bg-dark-bg">
      {/* Top tabs */}
      <div className="flex items-center gap-6 px-3 pt-3">
        <button
          className={cn(
            'relative pb-2 text-sm font-medium',
            activeTab === 'leaders' ? 'text-church-primary' : 'text-light-text dark:text-dark-text hover:text-church-primary'
          )}
          onClick={() => setActiveTab('leaders')}
        >
          Líderes
          <span className="ml-2 inline-flex items-center justify-center text-[11px] px-1.5 rounded-full bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text">
            {users.filter(u => u.id !== currentUserId).length}
          </span>
          {activeTab === 'leaders' && (
            <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-church-primary" />
          )}
        </button>
        <button
          className={cn(
            'relative pb-2 text-sm font-medium',
            activeTab === 'departments' ? 'text-church-primary' : 'text-light-text dark:text-dark-text hover:text-church-primary'
          )}
          onClick={() => setActiveTab('departments')}
        >
          Minist./Depart.
          <span className="ml-2 inline-flex items-center justify-center text-[11px] px-1.5 rounded-full bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text">
            {groups.length}
          </span>
          {activeTab === 'departments' && (
            <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-church-primary" />
          )}
        </button>
        <button
          className={cn(
            'relative pb-2 text-sm font-medium',
            activeTab === 'members' ? 'text-church-primary' : 'text-light-text dark:text-dark-text hover:text-church-primary'
          )}
          onClick={() => setActiveTab('members')}
        >
          Membros
          <span className="ml-2 inline-flex items-center justify-center text-[11px] px-1.5 rounded-full bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text">
            {users.length}
          </span>
          {activeTab === 'members' && (
            <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-church-primary" />
          )}
        </button>
      </div>
      {/* Search */}
      <div className="p-3 border-b border-jkd-border">
        <input
          type="text"
          placeholder={membersPlaceholder}
          className="w-full px-3 py-2 rounded-md bg-light-bg-muted dark:bg-dark-bg-muted text-light-text dark:text-dark-text outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Content by tab */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px - 48px)' }}>
        {activeTab === 'leaders' && (
          <div>
            {filteredUsers.map(u => (
              <button
                key={u.id}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 border-b border-jkd-border hover:bg-light-bg-muted dark:hover:bg-dark-bg-muted text-left',
                  selectedUserId === u.id ? 'bg-light-bg-muted dark:bg-dark-bg-muted' : ''
                )}
                onClick={() => onSelectUser(u.id)}
              >
                <Avatar src={u.avatarUrl} alt={u.name} size={36} isOnline={onlineUserIds.includes(u.id)} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-light-heading dark:text-dark-heading line-clamp-1">{u.name}</div>
                  <div className="text-xs text-light-text dark:text-dark-text opacity-70 line-clamp-1">{u.email || ''}</div>
                </div>
                {(unreadCountByUserId[u.id] || 0) > 0 && selectedUserId !== u.id && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-semibold">
                    {unreadCountByUserId[u.id] || 0}
                  </span>
                )}
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="p-4 text-center text-sm text-light-text dark:text-dark-text opacity-70">
                Nenhum líder encontrado.
              </div>
            )}
          </div>
        )}

        {activeTab === 'departments' && (
          <div>
            {filteredGroups.map(g => (
              <button
                key={g.id}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 border-b border-jkd-border hover:bg-light-bg-muted dark:hover:bg-dark-bg-muted text-left',
                  selectedGroupId === g.id ? 'bg-light-bg-muted dark:bg-dark-bg-muted' : ''
                )}
                onClick={() => onSelectGroup(g.id)}
              >
                <Avatar src={g.logoUrl} alt={g.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-light-heading dark:text-dark-heading line-clamp-1">{g.name}</div>
                  <div className="text-xs text-light-text dark:text-dark-text opacity-70 line-clamp-1">{countActiveLeaders(g)} líderes</div>
                </div>
                {(unreadCountByGroupId[g.id] || 0) > 0 && selectedGroupId !== g.id && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-semibold">
                    {unreadCountByGroupId[g.id] || 0}
                  </span>
                )}
              </button>
            ))}
            {filteredGroups.length === 0 && (
              <div className="p-4 text-center text-sm text-light-text dark:text-dark-text opacity-70">
                Nenhum ministério ou departamento encontrado.
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div>
            <div className="px-3 py-2 text-xs font-semibold text-light-text dark:text-dark-text">Ministérios</div>
            {filteredGroups.map(g => (
              <button key={g.id} className={cn(
                'w-full flex items-center gap-3 px-3 py-2 border-b border-jkd-border hover:bg-light-bg-muted dark:hover:bg-dark-bg-muted text-left',
                selectedGroupId === g.id ? 'bg-light-bg-muted dark:bg-dark-bg-muted' : ''
              )} onClick={() => onSelectGroup(g.id)}>
                <Avatar src={g.logoUrl} alt={g.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-light-heading dark:text-dark-heading line-clamp-1">{g.name}</div>
                  <div className="text-xs text-light-text dark:text-dark-text opacity-70 line-clamp-1">{countActiveLeaders(g)} líderes</div>
                </div>
                {(unreadCountByGroupId[g.id] || 0) > 0 && selectedGroupId !== g.id && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-semibold">
                    {unreadCountByGroupId[g.id] || 0}
                  </span>
                )}
              </button>
            ))}

            <div className="px-3 py-2 text-xs font-semibold text-light-text dark:text-dark-text">Membros</div>
            {filteredUsers.map(u => (
              <button
                key={u.id}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 border-b border-jkd-border hover:bg-light-bg-muted dark:hover:bg-dark-bg-muted text-left',
                  selectedUserId === u.id ? 'bg-light-bg-muted dark:bg-dark-bg-muted' : ''
                )}
                onClick={() => onSelectUser(u.id)}
              >
                <Avatar src={u.avatarUrl} alt={u.name} size={36} isOnline={onlineUserIds.includes(u.id)} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-light-heading dark:text-dark-heading line-clamp-1">{u.name}</div>
                  <div className="text-xs text-light-text dark:text-dark-text opacity-70 line-clamp-1">{u.email || ''}</div>
                </div>
                {(unreadCountByUserId[u.id] || 0) > 0 && selectedUserId !== u.id && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[11px] font-semibold">
                    {unreadCountByUserId[u.id] || 0}
                  </span>
                )}
              </button>
            ))}

            {filteredGroups.length === 0 && filteredUsers.length === 0 && (
              <div className="p-4 text-center text-sm text-light-text dark:text-dark-text opacity-70">
                Nenhum resultado encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default SidePanel;