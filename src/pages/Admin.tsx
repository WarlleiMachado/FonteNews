import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Settings, CheckCircle, Bell, Users, Church, Info, Image, Send, FileText, Video, HelpCircle, Tags } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { useToast } from '../contexts/ToastContext';
import ApprovalsTab from '../components/Admin/ApprovalsTab';
import UsersTab from '../components/Admin/UsersTab';
import UserAnalyticsTab from '../components/Admin/UserAnalyticsTab';
import CultosTab from '../components/Admin/CultosTab';
import SettingsTab from '../components/Admin/SettingsTab';
import RequestsTab from '../components/Admin/RequestsTab';
import VideoNewsTab from '../components/Admin/VideoNewsTab';
import HelpTab from '../components/Admin/HelpTab';
import TaxonomiesTab from '../components/Admin/TaxonomiesTab';

type AdminTab = 'approvals' | 'requests' | 'users' | 'userAnalytics' | 'cultos' | 'video' | 'settings' | 'taxonomias' | 'help';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { leaderRequests, announcements } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('approvals');
  const location = useLocation();
  const navigate = useNavigate();
  // Removemos estado de banner inline em favor de toast flutuante
  
  const pendingRequestsCount = leaderRequests.filter(r => r.status === 'pending').length;
  const pendingApprovalsCount = announcements.filter(a => a.status === 'pending').length;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSave = () => {
    showToast('success', 'Configurações salvas com sucesso!');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'approvals': return <ApprovalsTab />;
      case 'requests': return <RequestsTab />;
      case 'users': return <UsersTab />;
      case 'userAnalytics': return <UserAnalyticsTab />;
      case 'cultos': return <CultosTab onSave={handleSave} />;
      case 'video': return <VideoNewsTab onSave={handleSave} />;
      case 'settings': return <SettingsTab onSave={handleSave} />;
      case 'taxonomias': return <TaxonomiesTab />;
      case 'help': return <HelpTab />;
      default: return null;
    }
  };

  const TabButton: React.FC<{ tabName: AdminTab; label: string; icon: React.ReactNode; count?: number; badgeClassName?: string }> = ({ tabName, label, icon, count, badgeClassName }) => (
    <button
      onClick={() => { setActiveTab(tabName); try { const params = new URLSearchParams(location.search); params.set('tab', tabName); navigate({ pathname: '/admin', search: params.toString() }); } catch {} }}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left ${
        activeTab === tabName
          ? 'bg-church-primary/10 text-church-primary'
          : 'text-jkd-text hover:bg-jkd-bg-sec'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`ml-auto ${badgeClassName || 'bg-church-primary'} text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>{count}</span>
      )}
    </button>
  );

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tabParam = params.get('tab') as AdminTab | null;
      const allowed: AdminTab[] = ['approvals','requests','users','userAnalytics','cultos','video','settings','taxonomias','help'];
      if (tabParam && allowed.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    } catch {}
  }, [location.search]);

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-8 w-8 text-church-primary" />
            <h1 className="text-3xl font-bold text-jkd-heading">Painel Administrativo</h1>
          </div>
          <p className="text-jkd-text">
            Gerencie aprovações, líderes, mensagens e configurações do sistema.
          </p>
        </div>

        <div className="space-y-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 rounded-lg p-4 flex items-start gap-3">
              <Info size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Lógica de Limpeza Automática</h4>
                <p className="text-sm">Itens não recorrentes são automaticamente apagados 30 dias após sua data de ocorrência.</p>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 text-orange-800 dark:text-orange-300 rounded-lg p-4 flex items-start gap-3">
              <Image size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold">Limite de Imagem</h4>
                <p className="text-sm">O tamanho máximo para qualquer imagem é de <strong>5MB</strong>.</p>
              </div>
            </div>
        </div>

        {/* Notificações inline removidas; usamos toasts flutuantes para feedback de ações */}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-1/4">
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-4 space-y-2">
              <TabButton tabName="approvals" label="Aprovações" icon={<CheckCircle size={16} />} count={pendingApprovalsCount} badgeClassName="bg-red-600" />
              <TabButton tabName="requests" label="Solicitações" icon={<FileText size={16} />} count={pendingRequestsCount} badgeClassName="bg-orange-500" />
              <TabButton tabName="userAnalytics" label="Usuários" icon={<Users size={16} />} />
              <TabButton tabName="users" label="Líderes" icon={<Users size={16} />} />
              <TabButton tabName="cultos" label="Cultos" icon={<Church size={16} />} />
              <TabButton tabName="video" label="Vídeo News" icon={<Video size={16} />} />
              <button
                onClick={() => navigate('/admin/ecclesia')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors w-full text-left text-jkd-text hover:bg-jkd-bg-sec`}
              >
                <Users size={16} />
                <span>Eclésia</span>
              </button>
              <TabButton tabName="taxonomias" label="Taxonomias" icon={<Tags size={16} />} />
              <TabButton tabName="help" label="Ajuda" icon={<HelpCircle size={16} />} />
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4">
            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;
