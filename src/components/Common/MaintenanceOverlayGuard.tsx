import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import { useLocation } from 'react-router-dom';
import MaintenancePage from '../../pages/Site/MaintenancePage';
import MaintenanceOverlay from './MaintenanceOverlay';

/**
 * Guarda de manutenção que renderiza overlay fullscreen em vez de redirecionar
 * Isso garante que a manutenção cubra TUDO incluindo menu, rodapé e ticker
 */
export const MaintenanceOverlayGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { config: maintenanceConfig } = useMaintenance();
  const location = useLocation();

  // Verificar se é modo preview
  const searchParams = new URLSearchParams(location.search);
  const isPreview = searchParams.get('preview') === 'true';

  // Rotas que não devem ser bloqueadas (admin e manutenção)
  const allowedRoutes = [
    '/login',
    '/site/maintenance/preview',
    '/site/maintenance/edit',
    '/site/gerenciamento'
  ];

  const isAllowedRoute = allowedRoutes.some(route => location.pathname.startsWith(route));

  console.log('[MaintenanceOverlayGuard] ===== CHECK =====');
  console.log('[MaintenanceOverlayGuard] Path:', location.pathname);
  console.log('[MaintenanceOverlayGuard] User:', user?.role || 'No user');
  console.log('[MaintenanceOverlayGuard] Maintenance Active:', maintenanceConfig.isActive);
  console.log('[MaintenanceOverlayGuard] Is Preview:', isPreview);
  console.log('[MaintenanceOverlayGuard] Is Allowed Route:', isAllowedRoute);
  console.log('[MaintenanceOverlayGuard] Should Block:', maintenanceConfig.isActive && (!user || user.role !== 'admin') && !isAllowedRoute && !isPreview);
  console.log('[MaintenanceOverlayGuard] ======================');

  // Se estiver carregando, não bloquear
  if (authLoading) {
    return <>{children}</>;
  }

  // Se for rota permitida, não bloquear
  if (isAllowedRoute) {
    return <>{children}</>;
  }

  // Se for modo preview, não bloquear
  if (isPreview) {
    return <>{children}</>;
  }

  // Se o modo manutenção estiver ativo e o usuário não for admin, mostrar overlay fullscreen
  if (maintenanceConfig.isActive && (!user || user.role !== 'admin')) {
    // Se tiver URL de redirecionamento, redirecionar para URL externa
    if (maintenanceConfig.useRedirect && maintenanceConfig.redirectUrl) {
      console.log('[MaintenanceOverlayGuard] Redirecting to external URL:', maintenanceConfig.redirectUrl);
      window.location.href = maintenanceConfig.redirectUrl;
      return null;
    }
    
    // Renderizar overlay fullscreen que cobre TUDO
    console.log('[MaintenanceOverlayGuard] Showing maintenance overlay');
    return <MaintenanceOverlay />;
  }

  // Caso contrário, permitir acesso normal
  return <>{children}</>;
};