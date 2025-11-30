import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import { useLocation } from 'react-router-dom';
import MaintenancePage from '../../pages/Site/MaintenancePage';

// Teste simples para verificar se o modo manutenção está funcionando
export const MaintenanceTest: React.FC = () => {
  const { user } = useAuth();
  const { config } = useMaintenance();
  const location = useLocation();

  useEffect(() => {
    console.log('🔧 MAINTENANCE TEST 🔧');
    console.log('Path:', location.pathname);
    console.log('User:', user?.role || 'No user');
    console.log('Maintenance Active:', config.isActive);
    console.log('Should Block:', config.isActive && (!user || user.role !== 'admin'));
    console.log('🔧 END TEST 🔧');
  }, [user, config.isActive, location.pathname]);

  if (config.isActive && (!user || user.role !== 'admin')) {
    return <MaintenancePage />;
  }

  return null;
};