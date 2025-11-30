import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MaintenanceConfig, defaultMaintenanceConfig } from '../types/maintenance';
import { useApp } from '../hooks/useApp';
import { auth } from '../lib/firebase';
import { uploadMaintenanceImage, uploadMaintenanceImageFromBase64, deleteMaintenanceImage } from '../services/maintenanceImageService';

interface MaintenanceContextType {
  config: MaintenanceConfig;
  updateConfig: (config: Partial<MaintenanceConfig>) => void;
  toggleMaintenance: () => void;
  toggleRedirect: () => void;
  updateRedirectUrl: (url: string) => void;
  resetConfig: () => void;
  lastUpdated: number;
  uploadHeaderImage: (file: File) => Promise<string>;
  uploadHeaderImageFromBase64: (base64String: string, fileName?: string) => Promise<string>;
  deleteHeaderImage: () => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useApp();
  const [config, setConfig] = useState<MaintenanceConfig>(defaultMaintenanceConfig);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  // Sincronizar configuração global do Firestore com o estado local
  useEffect(() => {
    if (settings?.maintenanceMode) {
      console.log('[MaintenanceContext] ===== SINCRONIZAÇÃO FIRESTORE =====');
      console.log('[MaintenanceContext] AUTH STATUS:', auth.currentUser ? `Logado: ${auth.currentUser.uid}` : 'NÃO LOGADO');
      console.log('[MaintenanceContext] Config do Firestore:', settings.maintenanceMode);
      console.log('[MaintenanceContext] headerImageUrl do Firestore:', settings.maintenanceMode.headerImageUrl);
      console.log('[MaintenanceContext] Logo do Firestore:', {
        showLogo: settings.maintenanceMode.showLogo,
        logoUrl: settings.maintenanceMode.logoUrl,
        logoSize: settings.maintenanceMode.logoSize,
        headerImageUrl: settings.maintenanceMode.headerImageUrl
      });
      
      // **USAR CONFIGURAÇÕES DO FIRESTORE** ao invés das locais
      const globalConfig: MaintenanceConfig = {
        ...defaultMaintenanceConfig,
        isActive: settings.maintenanceMode.enabled || false,
        useRedirect: settings.maintenanceMode.redirectMode || false,
        redirectUrl: settings.maintenanceMode.redirectUrl || '',
        // **USAR CONFIGURAÇÕES VISUAIS DO FIRESTORE**
        title: settings.maintenanceMode.title || defaultMaintenanceConfig.title,
        description: settings.maintenanceMode.description || defaultMaintenanceConfig.description,
        backgroundImage: settings.maintenanceMode.backgroundImage || defaultMaintenanceConfig.backgroundImage,
        overlayImage: settings.maintenanceMode.overlayImage || defaultMaintenanceConfig.overlayImage,
        backgroundColor: settings.maintenanceMode.backgroundColor || defaultMaintenanceConfig.backgroundColor,
        overlayColor: settings.maintenanceMode.overlayColor || defaultMaintenanceConfig.overlayColor,
        textColor: settings.maintenanceMode.textColor || defaultMaintenanceConfig.textColor,
        titleSize: settings.maintenanceMode.titleSize || defaultMaintenanceConfig.titleSize,
        descriptionSize: settings.maintenanceMode.descriptionSize || defaultMaintenanceConfig.descriptionSize,
        titleAlign: settings.maintenanceMode.titleAlign || defaultMaintenanceConfig.titleAlign,
        descriptionAlign: settings.maintenanceMode.descriptionAlign || defaultMaintenanceConfig.descriptionAlign,
        titleWeight: settings.maintenanceMode.titleWeight || defaultMaintenanceConfig.titleWeight,
        descriptionWeight: settings.maintenanceMode.descriptionWeight || defaultMaintenanceConfig.descriptionWeight,
        showCountdown: settings.maintenanceMode.showCountdown ?? defaultMaintenanceConfig.showCountdown,
        countdownDate: settings.maintenanceMode.countdownDate || defaultMaintenanceConfig.countdownDate,
        countdownText: settings.maintenanceMode.countdownText || defaultMaintenanceConfig.countdownText,
        buttons: settings.maintenanceMode.buttons || defaultMaintenanceConfig.buttons,
        containerMaxWidth: settings.maintenanceMode.containerMaxWidth || defaultMaintenanceConfig.containerMaxWidth,
        verticalAlign: settings.maintenanceMode.verticalAlign || defaultMaintenanceConfig.verticalAlign,
        overlayOpacity: settings.maintenanceMode.overlayOpacity ?? defaultMaintenanceConfig.overlayOpacity,
        overlayBlur: settings.maintenanceMode.overlayBlur ?? defaultMaintenanceConfig.overlayBlur,
        customCSS: settings.maintenanceMode.customCSS || defaultMaintenanceConfig.customCSS,
        customHTML: settings.maintenanceMode.customHTML || defaultMaintenanceConfig.customHTML,
        contentAlignment: settings.maintenanceMode.contentAlignment || defaultMaintenanceConfig.contentAlignment,
        titleColor: settings.maintenanceMode.titleColor || defaultMaintenanceConfig.titleColor,
        descriptionColor: settings.maintenanceMode.descriptionColor || defaultMaintenanceConfig.descriptionColor,
        textShadow: settings.maintenanceMode.textShadow ?? defaultMaintenanceConfig.textShadow,
        backdropBlur: settings.maintenanceMode.backdropBlur ?? defaultMaintenanceConfig.backdropBlur,
        showLogo: settings.maintenanceMode.showLogo ?? defaultMaintenanceConfig.showLogo,
        logoUrl: settings.maintenanceMode.logoUrl || defaultMaintenanceConfig.logoUrl,
        logoSize: settings.maintenanceMode.logoSize || defaultMaintenanceConfig.logoSize,
        headerImageUrl: settings.maintenanceMode.headerImageUrl || defaultMaintenanceConfig.headerImageUrl
      };
      
      const forceMaintenance = (import.meta as any).env?.VITE_FORCE_MAINTENANCE === 'true';
      if (forceMaintenance) {
        globalConfig.isActive = true;
      }
      console.log('[MaintenanceContext] Configurações sincronizadas do Firestore:', globalConfig);
      console.log('[MaintenanceContext] Dados da logo sincronizados:', {
        showLogo: globalConfig.showLogo,
        logoUrl: globalConfig.logoUrl,
        logoSize: globalConfig.logoSize,
        headerImageUrl: globalConfig.headerImageUrl
      });
      
      // **COMPARAÇÃO CRÍTICA: Verificar se mudou**
      if (globalConfig.logoUrl !== config.logoUrl || globalConfig.showLogo !== config.showLogo) {
        console.log('[MaintenanceContext] 🚨 MUDANÇA DETECTADA NA LOGO!');
        console.log('[MaintenanceContext] Logo antiga:', { showLogo: config.showLogo, logoUrl: config.logoUrl });
        console.log('[MaintenanceContext] Logo nova:', { showLogo: globalConfig.showLogo, logoUrl: globalConfig.logoUrl });
      }
      
      setConfig(globalConfig);
      setLastUpdated(Date.now());
      
      console.log('[MaintenanceContext] ===== FIM SINCRONIZAÇÃO =====');
    }
  }, [settings?.maintenanceMode]);

  const updateConfig = async (updates: Partial<MaintenanceConfig>) => {
    console.log('[MaintenanceContext] ===== UPDATE CONFIG CHAMADO =====');
    console.log('[MaintenanceContext] Updates recebidos:', updates);
    console.log('[MaintenanceContext] Config atual:', config);
    
    // Log específico para headerImageUrl
    if (updates.headerImageUrl !== undefined) {
      console.log('[MaintenanceContext] 🖼️ ATUALIZANDO headerImageUrl:', updates.headerImageUrl);
    }
    
    const newConfig = { ...config, ...updates };
    console.log('[MaintenanceContext] Novo config:', newConfig);
    
    setConfig(newConfig);
    setLastUpdated(Date.now());
    
    // Se estiver atualizando a URL de redirecionamento, salvar no Firestore
    if (updates.redirectUrl !== undefined && updates.redirectUrl !== config.redirectUrl) {
      updateRedirectUrl(updates.redirectUrl);
    }
    
    // **SALVAR TODAS AS CONFIGURAÇÕES VISUAIS NO FIRESTORE - ABORDAGEM ROBUSTA**
    try {
      console.log('[MaintenanceContext] Iniciando salvamento robusto de configurações visuais...', updates);
      
      // **VERIFICAR AUTENTICAÇÃO ANTES DE TUDO**
      if (!auth.currentUser) {
        console.error('[MaintenanceContext] ERRO: Usuário não autenticado. Não é possível salvar configurações.');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      console.log('[MaintenanceContext] Usuário autenticado:', auth.currentUser.uid);
      
      // **VALIDAR DADOS ANTES DE ENVIAR**
      console.log('[MaintenanceContext] Validando dados da logo:', {
        showLogo: newConfig.showLogo,
        logoUrl: newConfig.logoUrl,
        logoSize: newConfig.logoSize,
        headerImageUrl: newConfig.headerImageUrl // ADICIONADO: Rastrear headerImageUrl
      });
      
      const maintenanceData = {
        enabled: settings?.maintenanceMode?.enabled ?? false,
        redirectMode: settings?.maintenanceMode?.redirectMode ?? false,
        redirectUrl: settings?.maintenanceMode?.redirectUrl ?? '',
        // Configurações visuais que serão salvas no Firestore
        title: newConfig.title || 'Sistema em Manutenção',
        description: newConfig.description || 'Estamos trabalhando para melhorar sua experiência.',
        backgroundImage: newConfig.backgroundImage || '',
        overlayImage: newConfig.overlayImage || '',
        logoUrl: newConfig.logoUrl || '',
        logoSize: newConfig.logoSize || 'md',
        showLogo: newConfig.showLogo ?? false,
        headerImageUrl: newConfig.headerImageUrl || '', // ADICIONADO: Campo faltante!
        backgroundColor: newConfig.backgroundColor || '#1a1a1a',
        overlayColor: newConfig.overlayColor || 'rgba(0,0,0,0.5)',
        textColor: newConfig.textColor || '#ffffff',
        titleSize: newConfig.titleSize || '4xl',
        descriptionSize: newConfig.descriptionSize || 'lg',
        titleAlign: newConfig.titleAlign || 'center',
        descriptionAlign: newConfig.descriptionAlign || 'center',
        titleWeight: newConfig.titleWeight || 'bold',
        descriptionWeight: newConfig.descriptionWeight || 'normal',
        showCountdown: newConfig.showCountdown || false,
        countdownDate: newConfig.countdownDate || '',
        countdownText: newConfig.countdownText || 'Tempo estimado',
        buttons: Array.isArray(newConfig.buttons) ? newConfig.buttons : [],
        containerMaxWidth: newConfig.containerMaxWidth || '4xl',
        verticalAlignment: newConfig.verticalAlignment || 'center',
        overlayOpacity: typeof newConfig.overlayOpacity === 'number' ? newConfig.overlayOpacity : 0.5,
        overlayBlur: typeof newConfig.overlayBlur === 'number' ? newConfig.overlayBlur : 0,
        customCSS: newConfig.customCSS || '',
        customHTML: newConfig.customHTML || '',
        contentAlignment: newConfig.contentAlignment || 'center',
        titleColor: newConfig.titleColor || '#ffffff',
        descriptionColor: newConfig.descriptionColor || '#e5e5e5',
        textShadow: newConfig.textShadow ?? true,
        backdropBlur: newConfig.backdropBlur ?? false
      };
      
      console.log('[MaintenanceContext] Dados validados para salvamento:', maintenanceData);
      
      // **TENTATIVA DE SALVAMENTO COM RETRY**
      let retryCount = 0;
      const maxRetries = 3;
      let lastError = null;
      
      while (retryCount < maxRetries) {
        try {
          console.log(`[MaintenanceContext] Tentativa ${retryCount + 1} de salvamento...`);
          
          await updateSettings({
            maintenanceMode: maintenanceData
          });
          
          console.log('[MaintenanceContext] ✅ Configurações visuais salvas com sucesso no Firestore!');
          console.log('[MaintenanceContext] Dados da logo salvos:', {
            showLogo: maintenanceData.showLogo,
            logoUrl: maintenanceData.logoUrl,
            logoSize: maintenanceData.logoSize,
            headerImageUrl: maintenanceData.headerImageUrl // ADICIONADO: Confirmar headerImageUrl salvo
          });
          break; // Sucesso, sair do loop
          
        } catch (error: any) {
          lastError = error;
          console.error(`[MaintenanceContext] ❌ Erro na tentativa ${retryCount + 1}:`, error);
          
          if (error.code === 'permission-denied') {
            console.error('[MaintenanceContext] ERRO CRÍTICO: Permissão negada. Verificando autenticação...');
            // Não tentar novamente se for permissão negada
            break;
          }
          
          if (error.code === 'unavailable' && retryCount < maxRetries - 1) {
            console.log(`[MaintenanceContext] 🔁 Firestore indisponível, tentando novamente em ${(retryCount + 1) * 1000}ms...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000));
          }
          
          retryCount++;
        }
      }
      
      if (retryCount === maxRetries && lastError) {
        console.error('[MaintenanceContext] ❌ Falha após todas as tentativas:', lastError);
        throw new Error(`Falha ao salvar configurações: ${lastError.message}`);
      }
      
      // **SALVAR BACKUP NO LOCALSTORAGE APÓS SUCESSO**
      localStorage.setItem('maintenance_visual_config_backup', JSON.stringify(newConfig));
      console.log('[MaintenanceContext] ✅ Backup salvo no localStorage');
      
    } catch (error) {
      console.error('[MaintenanceContext] ❌ Erro crítico no salvamento:', error);
      
      // **NOTIFICAR O USUÁRIO SOBRE O ERRO**
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('maintenance-save-error', { 
          detail: { error: error.message } 
        }));
      }
      
      throw error; // Re-throw para o chamador tratar
    }
  };

  const toggleMaintenance = async () => {
    const newEnabled = !config.isActive;
    console.log('[MaintenanceContext] Toggle maintenance global:', newEnabled);
    
    try {
      await updateSettings({
        maintenanceMode: {
          ...settings?.maintenanceMode,
          enabled: newEnabled
        }
      });
      
      // Atualizar estado local imediatamente
      setConfig(prev => ({ ...prev, isActive: newEnabled }));
      setLastUpdated(Date.now());
      
      console.log('[MaintenanceContext] Modo manutenção global alterado:', newEnabled);
    } catch (error) {
      console.error('[MaintenanceContext] Erro ao alterar modo manutenção:', error);
    }
  };

  const toggleRedirect = async () => {
    const newRedirectMode = !config.useRedirect;
    console.log('[MaintenanceContext] Toggle redirect mode global:', newRedirectMode);
    
    try {
      await updateSettings({
        maintenanceMode: {
          ...settings?.maintenanceMode,
          redirectMode: newRedirectMode
        }
      });
      
      // Atualizar estado local imediatamente
      setConfig(prev => ({ ...prev, useRedirect: newRedirectMode }));
      setLastUpdated(Date.now());
      
      console.log('[MaintenanceContext] Modo redirect global alterado:', newRedirectMode);
    } catch (error) {
      console.error('[MaintenanceContext] Erro ao alterar redirect mode:', error);
    }
  };

  const updateRedirectUrl = async (url: string) => {
    console.log('[MaintenanceContext] Update redirect URL global:', url);
    
    try {
      await updateSettings({
        maintenanceMode: {
          ...settings?.maintenanceMode,
          redirectUrl: url
        }
      });
      
      // Atualizar estado local imediatamente
      setConfig(prev => ({ ...prev, redirectUrl: url }));
      setLastUpdated(Date.now());
      
      console.log('[MaintenanceContext] URL de redirect global alterada:', url);
    } catch (error) {
      console.error('[MaintenanceContext] Erro ao alterar URL de redirect:', error);
    }
  };

  const resetConfig = async () => {
    // Resetar apenas configurações visuais locais
    const resetConfig = {
      ...defaultMaintenanceConfig,
      isActive: config.isActive, // Manter estado global
      useRedirect: config.useRedirect,
      redirectUrl: config.redirectUrl
    };
    
    setConfig(resetConfig);
    setLastUpdated(Date.now());
    
    // **Salvar reset no Firestore também**
    try {
      console.log('[MaintenanceContext] Resetando configurações no Firestore...');
      
      await updateSettings({
        maintenanceMode: {
          ...settings?.maintenanceMode,
          // Resetar configurações visuais para padrão, mantendo apenas globais
          title: resetConfig.title,
          description: resetConfig.description,
          backgroundImage: resetConfig.backgroundImage,
          overlayImage: resetConfig.overlayImage,
          backgroundColor: resetConfig.backgroundColor,
          overlayColor: resetConfig.overlayColor,
          textColor: resetConfig.textColor,
          titleSize: resetConfig.titleSize,
          descriptionSize: resetConfig.descriptionSize,
          titleAlign: resetConfig.titleAlign,
          descriptionAlign: resetConfig.descriptionAlign,
          titleWeight: resetConfig.titleWeight,
          descriptionWeight: resetConfig.descriptionWeight,
          showCountdown: resetConfig.showCountdown,
          countdownDate: resetConfig.countdownDate,
          countdownText: resetConfig.countdownText,
          buttons: resetConfig.buttons,
          containerMaxWidth: resetConfig.containerMaxWidth,
          verticalAlign: resetConfig.verticalAlignment,
          overlayOpacity: resetConfig.overlayOpacity,
          overlayBlur: resetConfig.overlayBlur,
          customCSS: resetConfig.customCSS,
          customHTML: resetConfig.customHTML,
          contentAlignment: resetConfig.contentAlignment,
          titleColor: resetConfig.titleColor,
          descriptionColor: resetConfig.descriptionColor,
          textShadow: resetConfig.textShadow,
          backdropBlur: resetConfig.backdropBlur,
          showLogo: resetConfig.showLogo,
          logoUrl: resetConfig.logoUrl,
          logoSize: resetConfig.logoSize
        }
      });
      
      console.log('[MaintenanceContext] Configurações resetadas no Firestore!');
      
      // Também salvar no localStorage
      localStorage.setItem('maintenance_visual_config', JSON.stringify(resetConfig));
    } catch (error) {
      console.error('[MaintenanceContext] Erro ao resetar configurações no Firestore:', error);
      // Mesmo com erro, salvar no localStorage
      localStorage.setItem('maintenance_visual_config', JSON.stringify(resetConfig));
    }
  };

  // **FUNÇÕES DE UPLOAD DE IMAGENS - NOVA ABORDAGEM**
  const uploadHeaderImage = async (file: File): Promise<string> => {
    try {
      console.log('[MaintenanceContext] 📤 Iniciando upload de imagem do cabeçalho');
      console.log('[MaintenanceContext] 📊 Arquivo recebido:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Verificar autenticação antes de tentar upload
      if (!auth.currentUser) {
        console.error('[MaintenanceContext] ❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      // Fazer upload para o Firebase Storage
      console.log('[MaintenanceContext] 🚀 Chamando uploadMaintenanceImage...');
      const { url, storagePath } = await uploadMaintenanceImage(file);
      
      console.log('[MaintenanceContext] ✅ Upload concluído:', { url, storagePath });
      
      // Atualizar configuração com a nova URL
      console.log('[MaintenanceContext] 💾 Atualizando config com nova URL...');
      await updateConfig({ 
        headerImageUrl: url,
        // Opcionalmente, salvar também o caminho do storage para deleção futura
        // headerImageStoragePath: storagePath
      });
      
      console.log('[MaintenanceContext] 🔄 Configuração atualizada com nova URL da imagem');
      return url;
      
    } catch (error) {
      console.error('[MaintenanceContext] ❌ Erro ao fazer upload da imagem do cabeçalho:', error);
      console.error('[MaintenanceContext] 📋 Detalhes do erro:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  };

  const uploadHeaderImageFromBase64 = async (base64String: string, fileName?: string): Promise<string> => {
    try {
      console.log('[MaintenanceContext] 📸 Convertendo base64 para upload');
      
      // Fazer upload a partir de base64
      const { url, storagePath } = await uploadMaintenanceImageFromBase64(base64String, fileName);
      
      console.log('[MaintenanceContext] ✅ Upload de base64 concluído:', { url, storagePath });
      
      // Atualizar configuração com a nova URL
      await updateConfig({ headerImageUrl: url });
      
      console.log('[MaintenanceContext] 🔄 Configuração atualizada com URL da imagem base64');
      return url;
      
    } catch (error) {
      console.error('[MaintenanceContext] ❌ Erro ao fazer upload da imagem base64:', error);
      throw error;
    }
  };

  const deleteHeaderImage = async (): Promise<void> => {
    try {
      console.log('[MaintenanceContext] 🗑️ Deletando imagem do cabeçalho');
      
      // Se tivermos o caminho do storage, deletar a imagem
      // Por enquanto, apenas limpar a URL da configuração
      await updateConfig({ headerImageUrl: '' });
      
      console.log('[MaintenanceContext] ✅ URL da imagem removida da configuração');
      
    } catch (error) {
      console.error('[MaintenanceContext] ❌ Erro ao deletar imagem do cabeçalho:', error);
      throw error;
    }
  };

  const value = { 
    config, 
    updateConfig, 
    toggleMaintenance, 
    toggleRedirect, 
    updateRedirectUrl,
    resetConfig, 
    lastUpdated,
    uploadHeaderImage,
    uploadHeaderImageFromBase64,
    deleteHeaderImage
  };

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};
