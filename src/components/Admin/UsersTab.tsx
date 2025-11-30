import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { AuthorizedUser, MinistryDepartment, UserRole } from '../../types';
import { Plus, Trash2, Edit, Save, X, Lock, Unlock, UserCheck, UserX, User, Users, UserMinus, UserPlus, AlertCircle, UploadCloud, Briefcase, Shield, Phone } from 'lucide-react';
import { uploadUserAvatar } from '../../services/uploadService';

const StatCard: React.FC<{ title: string; count: number; icon: React.ReactNode; color: string; onClick?: () => void; isActive?: boolean }> = ({ title, count, icon, color, onClick, isActive }) => (
    <div 
        className={`bg-jkd-bg-sec rounded-lg border p-4 flex items-center space-x-4 transition-all ${
            onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
        } ${
            isActive ? 'border-church-primary ring-2 ring-church-primary/20' : 'border-jkd-border'
        }`}
        onClick={onClick}
    >
        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-jkd-text">{title}</p>
            <p className="text-2xl font-bold text-jkd-heading">{count}</p>
        </div>
    </div>
);

const LeaderCard: React.FC<{ 
    user: AuthorizedUser; 
    isOnline: boolean;
    allDepartments: MinistryDepartment[];
    onEdit: (user: AuthorizedUser) => void; 
    onDelete: (id: string, name: string) => void; 
    onToggleBlock: (id: string, status: 'active' | 'blocked') => void;
    onToggleInactive: (id: string, status: 'active' | 'inactive') => void;
}> = ({ user, isOnline, allDepartments, onEdit, onDelete, onToggleBlock, onToggleInactive }) => {
    
    const statusInfo = {
        active: { text: 'Ativo', color: 'text-green-500 bg-green-500/10', icon: <UserCheck size={14} /> },
        blocked: { text: 'Bloqueado', color: 'text-red-500 bg-red-500/10', icon: <UserX size={14} /> },
        inactive: { text: 'Inativo', color: 'text-gray-500 bg-gray-500/10', icon: <User size={14} /> },
    }[user.status] || { text: 'Ativo', color: 'text-green-500 bg-green-500/10', icon: <UserCheck size={14} /> };
    
    console.log('🎯 LeaderCard - StatusInfo selecionado:', statusInfo.text, 'para status:', user.status);

    const userDepartments = allDepartments.filter(g => g.leaderIds.includes(user.id));
    
    const roleInfo = {
        admin: { text: 'Admin', icon: <Shield size={12} /> },
        editor: { text: 'Editor', icon: <Edit size={12} /> },
        leader: { text: 'Líder', icon: <User size={12} /> },
    }[user.role];

    return (
        <div className="bg-jkd-bg rounded-lg border border-jkd-border p-4 flex flex-col justify-between">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-center w-20">
                    <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=ff652c&color=fff`} alt={user.name} className="h-20 w-20 rounded-lg object-cover mx-auto" />
                    <div className={`mt-2 inline-flex items-center justify-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                    </div>
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-jkd-heading">{user.name}</p>
                        <div className="flex items-center gap-1">
                            <span title={isOnline ? 'Online agora' : 'Offline'} className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                            <span className={`text-xs font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-jkd-text truncate">{user.email}</p>
                    
                    <div className="mt-2 space-y-2 text-xs text-jkd-text/80">
                        <div className="flex items-center gap-1.5">
                            {roleInfo.icon}
                            <span>Função: <strong>{roleInfo.text}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Phone size={12} />
                            <span>Telefone: <strong>{user.phone || 'Não definido'}</strong></span>
                        </div>
                    </div>

                    <div className="mt-3">
                         <p className="text-xs text-jkd-text/80 mb-1">Ministérios / Departamentos:</p>
                         <div className="flex flex-wrap gap-1">
                            {userDepartments.length > 0 ? userDepartments.map(group => (
                                <span key={group.id} className="px-2 py-0.5 text-xs rounded-full bg-church-primary/10 text-church-primary">
                                    {group.name}
                                </span>
                            )) : <span className="text-xs text-jkd-text/60">Nenhum</span>}
                         </div>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 border-t border-jkd-border pt-3">
                {/* Oculta apenas os botões de status para os 2 administradores protegidos */}
                {!(user.role === 'admin' && (user.email === 'secretaria.adfdevidalaranjeiras@gmail.com' || user.email === 'fontedevidalaranjeiras@gmail.com')) && (
                    <>
                        <button 
                            onClick={() => onToggleInactive(user.id, user.status === 'active' ? 'inactive' : 'active')} 
                            className="p-2 rounded-md text-jkd-text hover:bg-blue-500/10 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                            title={user.status === 'active' ? 'Inativar' : 'Ativar'}
                            disabled={user.status === 'blocked'}
                        >
                            {user.status === 'active' ? <UserMinus size={16} /> : <UserPlus size={16} />}
                        </button>
                        <button 
                            onClick={() => onToggleBlock(user.id, user.status === 'active' ? 'blocked' : 'active')} 
                            className="p-2 rounded-md text-jkd-text hover:bg-yellow-500/10 hover:text-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                            title={user.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                            disabled={user.status === 'inactive'}
                        >
                            {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                        <button onClick={() => onEdit(user)} className="p-2 rounded-md text-jkd-text hover:bg-church-primary/10 hover:text-church-primary" title="Editar">
                            <Edit size={16} />
                        </button>
                        <button onClick={() => onDelete(user.id, user.name)} className="p-2 rounded-md text-jkd-text hover:bg-red-500/10 hover:text-red-500" title="Excluir">
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const UsersTab: React.FC = () => {
  const { authorizedUsers, onlineUserIds, addAuthorizedUser, updateAuthorizedUser, removeAuthorizedUser, showConfirmation, updateLeaderMinistryDepartmentMembership, ministryDepartments, addMinistryDepartment, deleteMinistryDepartment, leaderRequests, updateLeaderRequestStatus } = useApp();
  const [editingUser, setEditingUser] = useState<Partial<AuthorizedUser> | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'inactive'>('all');

  const stats = useMemo(() => ({
      total: authorizedUsers.length,
      active: authorizedUsers.filter(u => u.status === 'active').length,
      blocked: authorizedUsers.filter(u => u.status === 'blocked').length,
      inactive: authorizedUsers.filter(u => u.status === 'inactive').length,
  }), [authorizedUsers]);

  const filteredUsers = useMemo(() => {
    if (statusFilter === 'all') return authorizedUsers;
    return authorizedUsers.filter(user => user.status === statusFilter);
  }, [authorizedUsers, statusFilter]);

  const handleSaveUser = async (userToSave: Partial<AuthorizedUser>, groupIds: string[], avatarFile?: File | null) => {
    if (!userToSave.name || !userToSave.email) return;
    
    try {
      let savedUserId: string;
      let finalAvatarUrl = userToSave.avatarUrl;

      // Bloquear edição dos 2 administradores protegidos
      const targetProtected = authorizedUsers.find(u => u.id === userToSave.id);
      const isProtectedAdminEdit = targetProtected?.role === 'admin' && (targetProtected?.email === 'secretaria.adfdevidalaranjeiras@gmail.com' || targetProtected?.email === 'fontedevidalaranjeiras@gmail.com');
      if (isProtectedAdminEdit) {
        console.warn('Edição bloqueada para admin protegido:', targetProtected?.email);
        setEditingUser(null);
        return;
      }

      if (userToSave.id) {
        savedUserId = userToSave.id;
        // Se há arquivo de avatar, fazer upload e atualizar URL
        if (avatarFile) {
          finalAvatarUrl = await uploadUserAvatar(avatarFile, savedUserId);
        }
        await updateAuthorizedUser(savedUserId, { ...userToSave, avatarUrl: finalAvatarUrl });
      } else {
        // Criar o usuário com status 'active' por padrão
        savedUserId = await addAuthorizedUser({ 
          name: userToSave.name, 
          email: userToSave.email, 
          phone: userToSave.phone, 
          role: userToSave.role || 'leader', 
          avatarUrl: finalAvatarUrl, 
          status: 'active' 
        });
        
        // Auto-aprovar solicitações pendentes que correspondem ao e-mail criado
        try {
          const matchingRequests = leaderRequests.filter(r => r.status === 'pending' && r.email?.toLowerCase() === (userToSave.email || '').toLowerCase());
          for (const req of matchingRequests) {
            await updateLeaderRequestStatus(req.id, 'approved');
          }
        } catch (e) {
          console.warn('Falha ao auto-aprovar solicitações pendentes para o novo usuário:', e);
        }
        
        // Se há arquivo de avatar, fazer upload com o ID real e atualizar
        if (avatarFile) {
          finalAvatarUrl = await uploadUserAvatar(avatarFile, savedUserId);
          await updateAuthorizedUser(savedUserId, { avatarUrl: finalAvatarUrl });
        }
      }
      
      // Associar aos ministérios/departamentos
      if (groupIds.length > 0) {
        await updateLeaderMinistryDepartmentMembership(savedUserId, groupIds);
      }
      
      setEditingUser(null);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    const target = authorizedUsers.find(u => u.id === id);
    const isProtectedAdmin = target?.role === 'admin' && (target?.email === 'secretaria.adfdevidalaranjeiras@gmail.com' || target?.email === 'fontedevidalaranjeiras@gmail.com');
    if (isProtectedAdmin) {
      console.warn('Exclusão bloqueada para admin protegido:', target?.email);
      return;
    }
    showConfirmation('Remover Líder', `Tem certeza que deseja remover o acesso de ${name}?`, () => removeAuthorizedUser(id));
  };
  
  const handleDeleteGroup = (id: string, name: string) => {
    showConfirmation('Excluir Ministério / Departamento', `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`, () => deleteMinistryDepartment(id));
  };

  const handleToggleBlock = (id: string, newStatus: 'active' | 'blocked') => {
    const target = authorizedUsers.find(u => u.id === id);
    const isProtectedAdmin = target?.role === 'admin' && (target?.email === 'secretaria.adfdevidalaranjeiras@gmail.com' || target?.email === 'fontedevidalaranjeiras@gmail.com');
    if (isProtectedAdmin) {
      console.warn('Alteração de status bloqueada para admin protegido:', target?.email);
      return;
    }
    updateAuthorizedUser(id, { status: newStatus });
  };

  const handleToggleInactive = (id: string, newStatus: 'active' | 'inactive') => {
      const target = authorizedUsers.find(u => u.id === id);
      const isProtectedAdmin = target?.role === 'admin' && (target?.email === 'secretaria.adfdevidalaranjeiras@gmail.com' || target?.email === 'fontedevidalaranjeiras@gmail.com');
      if (isProtectedAdmin) {
        console.warn('Alteração de status bloqueada para admin protegido:', target?.email);
        return;
      }
      updateAuthorizedUser(id, { status: newStatus });
  };

  if (editingUser) {
    return <UserForm 
        user={editingUser} 
        onSave={handleSaveUser} 
        onCancel={() => setEditingUser(null)} 
        allDepartments={ministryDepartments}
        addDepartment={addMinistryDepartment}
        deleteDepartment={handleDeleteGroup}
    />;
  }

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Total de Líderes" 
                count={stats.total} 
                icon={<Users size={24} className="text-blue-500"/>} 
                color="bg-blue-500/10" 
                onClick={() => setStatusFilter('all')}
                isActive={statusFilter === 'all'}
            />
            <StatCard 
                title="Ativos" 
                count={stats.active} 
                icon={<UserCheck size={24} className="text-green-500"/>} 
                color="bg-green-500/10" 
                onClick={() => setStatusFilter('active')}
                isActive={statusFilter === 'active'}
            />
            <StatCard 
                title="Bloqueados" 
                count={stats.blocked} 
                icon={<UserX size={24} className="text-red-500"/>} 
                color="bg-red-500/10" 
                onClick={() => setStatusFilter('blocked')}
                isActive={statusFilter === 'blocked'}
            />
            <StatCard 
                title="Inativos" 
                count={stats.inactive} 
                icon={<User size={24} className="text-gray-500"/>} 
                color="bg-gray-500/10" 
                onClick={() => setStatusFilter('inactive')}
                isActive={statusFilter === 'inactive'}
            />
        </div>

        <div className="bg-church-primary/10 rounded-lg border border-jkd-border">
            <div className="p-6 border-b border-jkd-border flex justify-between items-center">
                <h2 className="text-lg font-semibold text-jkd-heading">Líderes Autorizados</h2>
                <button onClick={() => setEditingUser({ role: 'leader' })} className="inline-flex items-center space-x-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90">
                    <Plus size={16} />
                    <span>Novo Líder</span>
                </button>
            </div>
            <div className="p-6">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                        <User size={48} className="mx-auto text-jkd-text/50 mb-4" />
                        <p className="text-jkd-text/70">Nenhum líder encontrado para o filtro selecionado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredUsers.map(user => (
                            <LeaderCard 
                                key={user.id} 
                                user={user} 
                                isOnline={onlineUserIds.includes(user.id)}
                                allDepartments={ministryDepartments}
                                onEdit={() => setEditingUser(user)} 
                                onDelete={handleDeleteUser} 
                                onToggleBlock={handleToggleBlock} 
                                onToggleInactive={handleToggleInactive}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

// --- UserForm Component ---
interface UserFormProps {
  user?: Partial<AuthorizedUser>;
  onSave: (user: Partial<AuthorizedUser>, groupIds: string[], avatarFile?: File | null) => Promise<void>;
  onCancel?: () => void;
  allDepartments: MinistryDepartment[];
  addDepartment: (group: Omit<MinistryDepartment, 'id'>) => Promise<void>;
  deleteDepartment: (id: string, name: string) => void;
}



const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel, allDepartments, addDepartment, deleteDepartment }) => {
  const isEditing = !!user?.id;
  const [formData, setFormData] = useState({ id: user?.id, name: user?.name || '', email: user?.email || '', phone: user?.phone || '', avatarUrl: user?.avatarUrl || '', role: user?.role || 'leader' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
        const currentUserGroups = allDepartments.filter(g => g.leaderIds.includes(user.id!)).map(g => g.id);
        setSelectedGroupIds(currentUserGroups);
    }
  }, [user, allDepartments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isEditing && selectedGroupIds.length === 0) {
        setError('É obrigatório selecionar pelo menos um Ministério / Departamento para um novo usuário.');
        return;
    }

    let finalAvatarUrl = formData.avatarUrl;
    
    // Não fazer upload aqui para novos usuários; o upload será feito no handler com o ID real
    onSave({ ...formData, avatarUrl: finalAvatarUrl }, selectedGroupIds, avatarFile);
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };

  const handleCreateGroup = async () => {
    if (newGroupName.trim() && !allDepartments.some(g => g.name.toLowerCase() === newGroupName.trim().toLowerCase())) {
        try {
          await addDepartment({ name: newGroupName.trim(), leaderIds: [] });
          setNewGroupName('');
        } catch (error) {
          console.error('Erro ao criar ministério/departamento:', error);
          setError('Erro ao criar ministério/departamento. Tente novamente.');
        }
    }
  };
  
  const handleAvatarUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, avatarUrl: url }));
    if (url) {
      setAvatarFile(null);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setFormData(prev => ({ ...prev, avatarUrl: '' }));
    }
  };

  const ROLES: { value: UserRole, label: string }[] = [
      { value: 'leader', label: 'Líder' },
      { value: 'editor', label: 'Editor' },
      { value: 'admin', label: 'Admin' },
  ];

  return (
    <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
      <div className="p-6 border-b border-jkd-border">
        <h2 className="text-lg font-semibold text-jkd-heading">{isEditing ? 'Editar Líder' : 'Adicionar Novo Líder'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-jkd-heading mb-1">Nome *</label>
            <input type="text" id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="w-full input-style" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-jkd-heading mb-1">Email *</label>
            <input type="email" id="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="w-full input-style" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-jkd-heading mb-1">Função *</label>
            <select id="role" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })} required className="w-full input-style">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-jkd-heading mb-1">Telefone *</label>
            <input type="tel" id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required className="w-full input-style" />
          </div>
        </div>

        {/* Avatar Management */}
        <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-jkd-heading mb-1">Foto de Perfil</label>
            <input type="url" placeholder="URL da foto" value={formData.avatarUrl} onChange={e => handleAvatarUrlChange(e.target.value)} disabled={!!avatarFile} className="w-full input-style disabled:bg-jkd-border/20" />
            <div className="relative flex items-center justify-center my-2">
                <div className="flex-grow border-t border-jkd-border"></div><span className="flex-shrink mx-4 text-jkd-text text-sm">ou</span><div className="flex-grow border-t border-jkd-border"></div>
            </div>
            {avatarFile ? (
                <div className="flex items-center justify-between bg-jkd-bg p-2 rounded-lg border border-jkd-border">
                    <p className="text-sm text-jkd-text truncate">{avatarFile.name}</p>
                    <button type="button" onClick={() => setAvatarFile(null)} className="p-1 rounded-full hover:bg-red-500/10 text-red-500"><X size={16} /></button>
                </div>
            ) : (
                <label htmlFor="avatar-upload" className={`relative cursor-pointer rounded-lg border-2 border-dashed border-jkd-border w-full p-4 flex justify-center items-center text-center transition-colors ${formData.avatarUrl ? 'bg-jkd-border/20 cursor-not-allowed opacity-50' : 'hover:border-church-primary'}`}>
                    <div className="space-y-1 text-jkd-text"><UploadCloud className="mx-auto h-8 w-8" /><span className="font-medium text-church-primary text-sm">Clique para enviar</span><p className="text-xs">PNG, JPG até 5MB</p></div>
                    <input id="avatar-upload" type="file" className="sr-only" onChange={handleAvatarFileChange} disabled={!!formData.avatarUrl} accept="image/*" />
                </label>
            )}
        </div>

        {/* Group Management */}
        <div className="space-y-4">
            <h3 className="text-md font-semibold text-jkd-heading">Ministério / Departamento *</h3>
            <div className="bg-jkd-bg border border-jkd-border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {allDepartments.map(group => (
                    <div key={group.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input type="checkbox" id={`group-assign-${group.id}`} checked={selectedGroupIds.includes(group.id)} onChange={() => handleGroupToggle(group.id)} className="h-4 w-4 rounded border-gray-300 text-church-primary focus:ring-church-primary"/>
                            <label htmlFor={`group-assign-${group.id}`} className="ml-3 block text-sm text-jkd-text">{group.name}</label>
                        </div>
                        <button type="button" onClick={() => deleteDepartment(group.id, group.name)} className="p-1 rounded-full hover:bg-red-500/10 text-red-500">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="text" placeholder="Nome do novo Ministério / Departamento..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full input-style"/>
                <button type="button" onClick={handleCreateGroup} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-jkd-bg border border-jkd-border text-jkd-text hover:bg-jkd-border">
                    <Plus size={16} /> Criar
                </button>
            </div>
        </div>
        
        {error && (
            <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
            </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-jkd-border">
          {onCancel && <button type="button" onClick={onCancel} className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-jkd-bg"><X size={16} /><span>Cancelar</span></button>}
          <button type="submit" className="inline-flex items-center space-x-2 bg-church-primary text-white px-4 py-2 rounded-lg hover:bg-church-primary/90">
            {isEditing ? <Save size={16} /> : <Plus size={16} />}
            <span>{isEditing ? 'Salvar Alterações' : 'Adicionar Usuário'}</span>
          </button>
        </div>
        <style>{`.input-style { @apply px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary; }`}</style>
      </form>
    </div>
  );
};

export default UsersTab;
