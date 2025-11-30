import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../lib/firebase';
import { useMaintenance } from '../../contexts/MaintenanceContext';

/**
 * Guarda de rota que redireciona para manutenção quando ativado
 * Baseado no sistema de rascunho - usa Navigate para redirecionamento real
 */
export const MaintenanceRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { config: maintenanceConfig } = useMaintenance();
  const location = useLocation();
  const adminEmails = [
    'fontedevidalaranjeiras@gmail.com',
    'secretaria.adfdevidalaranjeiras@gmail.com'
  ];
  const isAdminByEmail = Boolean(auth.currentUser?.email && adminEmails.includes(auth.currentUser.email));

  // Verificar se é modo preview
  const searchParams = new URLSearchParams(location.search);
  const isPreview = searchParams.get('preview') === 'true';

  // Rotas que não devem ser bloqueadas
  const allowedRoutes = [
    '/login',
    '/site/maintenance',
    '/site/maintenance/preview',
    '/site/maintenance/edit'
  ];

  const isAllowedRoute = allowedRoutes.some(route => location.pathname.startsWith(route));

  console.log('[MaintenanceRouteGuard] ===== CHECK =====');
  console.log('[MaintenanceRouteGuard] Path:', location.pathname);
  console.log('[MaintenanceRouteGuard] User:', user?.role || 'No user');
  console.log('[MaintenanceRouteGuard] Maintenance Active:', maintenanceConfig.isActive);
  console.log('[MaintenanceRouteGuard] Is Preview:', isPreview);
  console.log('[MaintenanceRouteGuard] Is Allowed Route:', isAllowedRoute);
  console.log('[MaintenanceRouteGuard] Should Redirect:', maintenanceConfig.isActive && (!user || (user.role !== 'admin' && !isAdminByEmail)) && !isAllowedRoute && !isPreview);
  console.log('[MaintenanceRouteGuard] ======================');

  // Durante carregamento de auth, bloquear apenas visitantes sem sessão
  if (authLoading) {
    const hasFirebaseSession = Boolean(auth.currentUser);
    
    // Se não há sessão Firebase e manutenção está ativa, bloquear
    if (!hasFirebaseSession && maintenanceConfig.isActive && !isAllowedRoute && !isPreview) {
      if (maintenanceConfig.useRedirect && maintenanceConfig.redirectUrl) {
        window.location.href = maintenanceConfig.redirectUrl;
        return null;
      }
      return <Navigate to="/site/maintenance" replace />;
    }
    
    // Se há sessão (qualquer usuário logado), não bloquear durante carregamento
    // O auth completo vai determinar se é admin ou não
    return <>{children}</>;
  }

  // Se for rota permitida, não redirecionar
  if (isAllowedRoute) {
    return <>{children}</>;
  }

  // Se for modo preview, não redirecionar
  if (isPreview) {
    return <>{children}</>;
  }

  // Se o modo manutenção estiver ativo e o usuário não for admin, redirecionar
  if (maintenanceConfig.isActive && (!user || (user.role !== 'admin' && !isAdminByEmail))) {
    // Se tiver URL de redirecionamento, redirecionar para URL externa
    if (maintenanceConfig.useRedirect && maintenanceConfig.redirectUrl) {
      console.log('[MaintenanceRouteGuard] Redirecting to external URL:', maintenanceConfig.redirectUrl);
      window.location.href = maintenanceConfig.redirectUrl;
      return null; // Não renderizar nada enquanto redireciona
    }
    
    // Redirecionar para página de manutenção interna
    console.log('[MaintenanceRouteGuard] Redirecting to maintenance page');
    return <Navigate to="/site/maintenance" replace />;
  }

  // Caso contrário, permitir acesso
  return <>{children}</>;
};
