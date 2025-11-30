import React from 'react';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import MaintenancePage from './MaintenancePage';

const MaintenancePreviewPage: React.FC = () => {
  const { config } = useMaintenance();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Simula a visão exata que um usuário comum veria */}
      <MaintenancePage isPreview={true} />
    </div>
  );
};

export default MaintenancePreviewPage;