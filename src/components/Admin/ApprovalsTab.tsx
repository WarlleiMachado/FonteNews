import React, { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import AnnouncementCard from '../Common/AnnouncementCard';
import { Bell } from 'lucide-react';

const ApprovalsTab: React.FC = () => {
  const { announcements, updateAnnouncement } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'pendentes' | 'restaurados'>('pendentes');
  const pendingAnnouncements = announcements.filter(a => a.status === 'pending' && !a.restoreRequested);
  const restoredAnnouncements = announcements.filter(a => a.status === 'pending' && a.restoreRequested);

  const handleApprove = (id: string) => {
    updateAnnouncement(id, { status: 'approved' });
  };

  const handleReject = (id: string) => {
    updateAnnouncement(id, { status: 'rejected' });
  };

  return (
    <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border">
      <div className="p-6 border-b border-jkd-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-jkd-heading">Aprovações</h2>
            <p className="text-sm text-jkd-text">Gerencie pendências e restaurações enviadas por líderes/editores.</p>
          </div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${activeSubTab === 'pendentes' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg border-jkd-border text-jkd-text hover:bg-jkd-bg-sec'}`}
              onClick={() => setActiveSubTab('pendentes')}
            >
              Pendentes ({pendingAnnouncements.length})
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${activeSubTab === 'restaurados' ? 'bg-church-primary text-white border-church-primary' : 'bg-jkd-bg border-jkd-border text-jkd-text hover:bg-jkd-bg-sec'}`}
              onClick={() => setActiveSubTab('restaurados')}
            >
              Restaurados ({restoredAnnouncements.length})
            </button>
          </div>
        </div>
      </div>
      <div className="p-6">
        {activeSubTab === 'pendentes' ? (
          pendingAnnouncements.length > 0 ? (
            <div className="space-y-6">
              {pendingAnnouncements.map(announcement => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  showApprovalActions={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-jkd-text">Nenhuma programação pendente.</p>
            </div>
          )
        ) : (
          restoredAnnouncements.length > 0 ? (
            <div className="space-y-6">
              {restoredAnnouncements.map(announcement => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  showApprovalActions={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-jkd-text">Nenhuma programação restaurada aguardando aprovação.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ApprovalsTab;
