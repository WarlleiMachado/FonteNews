import React, { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import { useLocation } from 'react-router-dom';
import MaintenancePage from '../../pages/Site/MaintenancePage';

/**
 * Componente global de manutenção que verifica se deve bloquear o acesso
 * Este componente funciona fora do Layout para garantir que todas as rotas sejam verificadas
 */
export const GlobalMaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { config: maintenanceConfig } = useMaintenance();
  const location = useLocation();

  // Rotas que não devem ser bloqueadas (admin e manutenção)
  const adminRoutes = [
    '/site/gerenciamento',
    '/site/maintenance',
    '/site/maintenance/preview',
    '/admin',
    '/dashboard',
    '/login'
  ];

  const isAdminRoute = adminRoutes.some(route => location.pathname.startsWith(route));

  useEffect(() => {
    console.log('[GlobalMaintenanceGuard] Check - Path:', location.pathname);
    console.log('[GlobalMaintenanceGuard] User:', user?.role || 'No user');
    console.log('[GlobalMaintenanceGuard] Maintenance Active:', maintenanceConfig.isActive);
    console.log('[GlobalMaintenanceGuard] HeaderImageUrl:', maintenanceConfig.headerImageUrl);
  }, [user, authLoading, maintenanceConfig.isActive, location.pathname, isAdminRoute, maintenanceConfig.headerImageUrl]);

  // Se estiver carregando, mostrar loading
  if (authLoading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Carregando...</div>
    </div>;
  }

  // Se for rota de admin, não bloquear
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Se o modo manutenção estiver ativo e o usuário não for admin, mostrar página de manutenção
  if (maintenanceConfig.isActive && (!user || user.role !== 'admin')) {
    console.log('[GlobalMaintenanceGuard] Renderizando maintenance page global');
    console.log('[GlobalMaintenanceGuard] Config que será passada para MaintenancePage:', {
      headerImageUrl: maintenanceConfig.headerImageUrl,
      title: maintenanceConfig.title,
      isActive: maintenanceConfig.isActive
    });
    return <MaintenancePage isPreview={false} />; // Passar isPreview=false para modo produção
  }

  // Caso contrário, permitir acesso
  return <>{children}</>;
};