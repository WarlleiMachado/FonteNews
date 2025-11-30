import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import { MaintenanceProvider } from './contexts/MaintenanceContext';
import { useAuth } from './hooks/useAuth';
import { useApp } from './hooks/useApp';
import { UserRole } from './types';
import { testFirebaseConnection, logFirebaseConfig } from './utils/firebaseTest';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import AgendaPage from './pages/Agenda';
import CultosPage from './pages/Cultos';
import Dashboard from './pages/Dashboard';
import NewAnnouncement from './pages/NewAnnouncement';
import EditAnnouncement from './pages/EditAnnouncement';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import CookiePolicy from './pages/CookiePolicy';
import ProfilePage from './pages/Profile';
import RequestAccessPage from './pages/RequestAccess';
import RoteirosPage from './pages/RoteirosPage';
import NewRoteiroPage from './pages/NewRoteiroPage';
import EditRoteiroPage from './pages/EditRoteiroPage';
import CursoSlideAdminPage from './pages/Site/CursoSlideAdminPage';
import CursoSlideConfigPage from './pages/Site/CursoSlideConfigPage';
import NewRoteiro2Page from './pages/NewRoteiro2Page';
import NewProgramacao2Page from './pages/NewProgramacao2Page';
import NewCulto2Page from './pages/NewCulto2Page';
import EditCultoPage from './pages/EditCultoPage';
import GaleriaPage from './pages/GaleriaPage';
import SiteHome from './pages/Site/SiteHome';

import PedidoDeOracaoPage from './pages/Site/PedidoDeOracaoPage';
import MinisteriosPage from './pages/Site/MinisteriosPage';
import MinisterioDetailPage from './pages/Site/MinisterioDetailPage';
import GerenciamentoPage from './pages/Site/GerenciamentoPage';
import MinisteriosConfigPage from './pages/Site/MinisteriosConfigPage';
import SiteHomeConfigPage from './pages/Site/SiteHomeConfigPage';
import LeaderChatConfigPage from './pages/Site/LeaderChatConfigPage';
import SiteScrollAnchorsConfigPage from './pages/Site/SiteScrollAnchorsConfigPage';
import BibliaNovaPage from './pages/Site/BibliaNovaPage';
import CursosPage from './pages/Site/CursosPage';
import JornadaVidaPage from './pages/Site/JornadaVidaPage';
import FonteAddPage from './pages/Site/FonteAddPage';
import TransbordePage from './pages/Site/TransbordePage';
import AgendaPastoralPage from './pages/Site/AgendaPastoralPage';
import OndeEstamosPage from './pages/Site/OndeEstamosPage';
import MaintenanceEditPage from './pages/Site/MaintenanceEditPage';
import MaintenancePage from './pages/Site/MaintenancePage';
import MaintenancePreviewPage from './pages/Site/MaintenancePreviewPage';
import { MaintenanceOverlayGuard } from './components/Common/MaintenanceOverlayGuard';

import CultoBlocosSettingsPage from './pages/Site/CultoBlocosSettingsPage';

import IntercessaoAdminPage from './pages/Site/IntercessaoAdminPage';
import IntercessaoPainelPage from './pages/Site/IntercessaoPainelPage';
import MeusPedidosPage from './pages/Site/MeusPedidosPage';
import ChatPage from './pages/ChatPage';
import AdminEcclesiaPage from './pages/AdminEcclesiaPage';

import ProgramacaoDetailPage from './pages/ProgramacaoDetailPage';
import CultoDetailPage from './pages/CultoDetailPage';



// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  // If auth is loading, avoid redirecting - show spinner instead so we don't cause redirect loops.
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-church-primary"></div>
      </div>
    );
  }

  if (!user) {
    // User isn't authenticated; send to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User doesn't have the required role
    return <Navigate to="/request-access" replace />;
  }

  return children;
};

// Componente que gerencia o carregamento da aplicação
const AppLoadingManager: React.FC = () => {
  const { isLoading: appLoading } = useApp();

  useEffect(() => {
    // Test Firebase connection on app start
    testFirebaseConnection();
    logFirebaseConfig();

    // Ajuste de StatusBar para Android (Capacitor): evitar overlay no topo/rodapé
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      // Cor de fundo da barra de status para combinar com o topo do app
      StatusBar.setBackgroundColor({ color: '#111827' }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);

  if (appLoading) {
    return <LoadingSpinner />;
  }

  return <AppRoutes />;
};

// Componente principal da aplicação
const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <MaintenanceOverlayGuard>
        <Layout>
          <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/cultos" element={<CultosPage />} />
          <Route path="/programacao/:id" element={<ProgramacaoDetailPage />} />
          <Route path="/culto/:id" element={<CultoDetailPage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/roteiros" element={<RoteirosPage />} />

          {/* Área do Site replicado (menu próprio) */}
          <Route path="/site" element={<SiteHome />} />

          {/* Página da Bíblia removida conforme solicitação */}
          {/* Nova página simples da Bíblia para teste incremental */}
          <Route path="/site/biblia" element={<BibliaNovaPage />} />
      
          <Route path="/site/pedido-de-oracao" element={<PedidoDeOracaoPage />} />
          <Route 
            path="/site/pedido-de-oracao/meus" 
            element={<MeusPedidosPage />} 
          />
          <Route 
            path="/site/pedido-de-oracao/admin" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <IntercessaoAdminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/site/pedido-de-oracao/painel" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <IntercessaoPainelPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/site/ministerios" element={<MinisteriosPage />} />
          <Route path="/site/ministerios/:slug" element={<MinisterioDetailPage />} />
          <Route path="/site/agenda-pastoral" element={<AgendaPastoralPage />} />
          <Route path="/site/transborde" element={<TransbordePage />} />
          <Route path="/site/onde-estamos" element={<OndeEstamosPage />} />
          <Route 
            path="/site/gerenciamento" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <GerenciamentoPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/site/gerenciamento/ministerios" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MinisteriosConfigPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/site/gerenciamento/inicio" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SiteHomeConfigPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/site/gerenciamento/anchors" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <SiteScrollAnchorsConfigPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/site/gerenciamento/lider-chat" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <LeaderChatConfigPage />
              </ProtectedRoute>
            } 
          />


          <Route 
            path="/site/gerenciamento/culto-blocos" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CultoBlocosSettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/site/gerenciamento/curso-slide" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CursoSlideAdminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/site/gerenciamento/curso-slide/config" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CursoSlideConfigPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/site/cursos" element={<CursosPage />} />
          <Route path="/site/jornada-vida" element={<JornadaVidaPage />} />
          
          {/* Modo Manutenção - rotas de edição (apenas admin) */}
          <Route 
            path="/site/maintenance/edit" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MaintenanceEditPage />
              </ProtectedRoute>
            } 
          />
          {/* Página de manutenção pública */}
          <Route path="/site/maintenance" element={<MaintenancePage />} />
          {/* Preview de manutenção (não bloqueado) */}
          <Route path="/site/maintenance/preview" element={<MaintenancePreviewPage />} />
          
          {/* Rotas protegidas - apenas usuários autenticados */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />

          {/* Rotas administrativas - apenas administradores */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/ecclesia" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEcclesiaPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/galeria" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <GaleriaPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/new-announcement" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <NewAnnouncement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-announcement/:id" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <EditAnnouncement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/new-roteiro" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <NewRoteiroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-roteiro/:id" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <EditRoteiroPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Rotas de teste para identificar problemas de exclusão */}
          <Route 
            path="/new-roteiro2" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <NewRoteiro2Page />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/new-programacao2" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <NewProgramacao2Page />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/new-culto2" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <NewCulto2Page />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/edit-culto/:id" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'leader', 'editor']}>
                <EditCultoPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/site/fonte-add" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <FonteAddPage />
              </ProtectedRoute>
            } 
          />
          

          {/* Rota de fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Layout>
      </MaintenanceOverlayGuard>
    </Router>
  );
};

// Componente raiz com todos os providers
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AppProvider>
            <AuthProvider>
              <MaintenanceProvider>
                <AppLoadingManager />
              </MaintenanceProvider>
            </AuthProvider>
          </AppProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
