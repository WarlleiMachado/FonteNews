import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import { useLocation } from 'react-router-dom';
import MaintenancePage from '../../pages/Site/MaintenancePage';
import LoadingSpinner from './LoadingSpinner';

interface MaintenanceGuardProps {
  children: React.ReactElement;
}

const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { config: maintenanceConfig } = useMaintenance();
  const location = useLocation();
  const [shouldShowMaintenance, setShouldShowMaintenance] = useState(false);

  console.log('[MaintenanceGuard] ===== COMPONENT RENDERED =====');
  console.log('[MaintenanceGuard] Initial state:', {
    authLoading,
    user: user?.role,
    maintenanceActive: maintenanceConfig.isActive,
    currentPath: location.pathname
  });

  // Rotas de administração que não devem ser bloqueadas
  const adminRoutes = [
    '/site/gerenciamento',
    '/site/maintenance',
    '/site/maintenance/preview', // Preview não deve ser bloqueado
    '/admin',
    '/dashboard',
    '/login'
  ];

  const isAdminRoute = adminRoutes.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    if (!authLoading) {
      console.log('[MaintenanceGuard] ====== MAINTENANCE GUARD CHECK ======');
      console.log('[MaintenanceGuard] isActive:', maintenanceConfig.isActive);
      console.log('[MaintenanceGuard] user:', user);
      console.log('[MaintenanceGuard] user?.role:', user?.role);
      console.log('[MaintenanceGuard] isAdminRoute:', isAdminRoute);
      console.log('[MaintenanceGuard] currentPath:', location.pathname);
      console.log('[MaintenanceGuard] ======================================');

      // Se for rota de admin, não bloqueia
      if (isAdminRoute) {
        console.log('[MaintenanceGuard] Admin route detected, not blocking');
        setShouldShowMaintenance(false);
        return;
      }

      // Se o modo manutenção estiver ativo e o usuário não for admin, mostrar página de manutenção
      if (maintenanceConfig.isActive && (!user || user.role !== 'admin')) {
        console.log('[MaintenanceGuard] 🚨 SHOWING MAINTENANCE PAGE - User is not admin or no user');
        setShouldShowMaintenance(true);
      } else if (maintenanceConfig.isActive && user && user.role === 'admin') {
        console.log('[MaintenanceGuard] ✅ Not showing maintenance page - User is admin');
        setShouldShowMaintenance(false);
      } else {
        console.log('[MaintenanceGuard] ✅ Not showing maintenance page - Maintenance mode inactive or no user');
        setShouldShowMaintenance(false);
      }
    }
  }, [user, authLoading, maintenanceConfig.isActive, isAdminRoute]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (shouldShowMaintenance) {
    return <MaintenancePage />;
  }

  return children;
};

export default MaintenanceGuard;