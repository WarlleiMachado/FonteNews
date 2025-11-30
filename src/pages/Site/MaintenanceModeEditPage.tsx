import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { useToast } from '../../contexts/ToastContext';
import { Save, Upload, AlignLeft, AlignCenter, AlignRight, Type, Image, Link, Plus, Trash2 } from 'lucide-react';
import { uploadImage } from '../../services/uploadService';

interface MaintenanceButton {
  id: string;
  text: string;
  link: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

interface MaintenanceSettings {
  enabled: boolean;
  redirectMode: boolean;
  redirectUrl: string;
  backgroundImage: string;
  backgroundColor: string;
  overlayImage: string;
  overlayOpacity: number;
  title: string;
  titleSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  titleColor: string;
  titleAlign: 'left' | 'center' | 'right';
  message: string;
  messageSize: 'sm' | 'md' | 'lg';
  messageColor: string;
  messageAlign: 'left' | 'center' | 'right';
  buttons: MaintenanceButton[];
  customCss: string;
}

const defaultSettings: MaintenanceSettings = {
  enabled: false,
  redirectMode: false,
  redirectUrl: '',
  backgroundImage: '',
  backgroundColor: '#ffffff',
  overlayImage: '',
  overlayOpacity: 0.5,
  title: 'Site em Manutenção',
  titleSize: '2xl',
  titleColor: '#000000',
  titleAlign: 'center',
  message: 'Estamos realizando melhorias no site. Por favor, volte em breve.',
  messageSize: 'md',
  messageColor: '#666666',
  messageAlign: 'center',
  buttons: [],
  customCss: ''
};

const MaintenanceModeEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>(
    settings.maintenanceMode || defaultSettings
  );

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalBackgroundImage = maintenanceSettings.backgroundImage;
      let finalOverlayImage = maintenanceSettings.overlayImage;

      // Upload background image if new file selected
      if (backgroundFile) {
        const safeName = backgroundFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        finalBackgroundImage = await uploadImage(
          backgroundFile, 
          `maintenance/background/${Date.now()}_${safeName}`
        );
      }

      // Upload overlay image if new file selected
      if (overlayFile) {
        const safeName = overlayFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        finalOverlayImage = await uploadImage(
          overlayFile,
          `maintenance/overlay/${Date.now()}_${safeName}`
        );
      }

      const finalSettings = {
        ...maintenanceSettings,
        backgroundImage: finalBackgroundImage,
        overlayImage: finalOverlayImage
      };

      await updateSettings({
        maintenanceMode: finalSettings
      });

      showToast('success', 'Configurações do Modo Manutenção salvas com sucesso!');
      navigate('/site/gerenciamento');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showToast('error', 'Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const addButton = () => {
    const newButton: MaintenanceButton = {
      id: Date.now().toString(),
      text: 'Novo Botão',
      link: '',
      backgroundColor: '#246BFD',
      textColor: '#ffffff',
      borderRadius: 'md'
    };
    setMaintenanceSettings(prev => ({
      ...prev,
      buttons: [...prev.buttons, newButton]
    }));
  };

  const removeButton = (id: string) => {
    setMaintenanceSettings(prev => ({
      ...prev,
      buttons: prev.buttons.filter(btn => btn.id !== id)
    }));
  };

  const updateButton = (id: string, updates: Partial<MaintenanceButton>) => {
    setMaintenanceSettings(prev => ({
      ...prev,
      buttons: prev.buttons.map(btn => 
        btn.id === id ? { ...btn, ...updates } : btn
      )
    }));
  };

  const getFontSize = (size: string) => {
    const sizes = {
      'sm': '14px',
      'md': '16px', 
      'lg': '18px',
      'xl': '20px',
      '2xl': '24px',
      '3xl': '30px'
    };
    return sizes[size as keyof typeof sizes] || '16px';
  };

  const getTextAlign = (align: string) => {
    const aligns = {
      'left': 'flex-start',
      'center': 'center', 
      'right': 'flex-end'
    };
    return aligns[align as keyof typeof aligns] || 'center';
  };

  const getBorderRadius = (radius: string) => {
    const radiuses = {
      'none': '0',
      'sm': '4px',
      'md': '8px', 
      'lg': '12px',
      'full': '9999px'
    };
    return radiuses[radius as keyof typeof radiuses] || '8px';
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-jkd-heading">Editar Modo Manutenção</h1>
            <p className="text-jkd-text mt-2">Configure o que os usuários verão quando o site estiver em manutenção.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/site/gerenciamento')}
              className="px-4 py-2 border border-jkd-border rounded-lg hover:bg-jkd-bg-sec"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-church-primary text-white rounded-lg hover:bg-church-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Painel de Configurações */}
          <div className="space-y-6">
            {/* Modo de Redirecionamento */}
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
              <h3 className="text-lg font-semibold text-jkd-heading mb-4">Modo de Redirecionamento</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Ativar Redirecionamento</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={maintenanceSettings.redirectMode}
                      onChange={(e) => setMaintenanceSettings(prev => ({ 
                        ...prev, 
                        redirectMode: e.target.checked 
                      }))}
                    />
                    <div className="toggle-container bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-church-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:transition-all"></div>
                  </label>
                </div>

                {maintenanceSettings.redirectMode && (
                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-2">
                      URL de Redirecionamento
                    </label>
                    <input
                      type="url"
                      value={maintenanceSettings.redirectUrl}
                      onChange={(e) => setMaintenanceSettings(prev => ({ 
                        ...prev, 
                        redirectUrl: e.target.value 
                      }))}
                      placeholder="https://exemplo.com/manutencao"
                      className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                    />
                    <p className="text-xs text-jkd-text mt-1">
                      Se definido, os usuários serão redirecionados para esta URL ao invés de ver a página de manutenção.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Configurações de Fundo */}
            {!maintenanceSettings.redirectMode && (
              <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
                <h3 className="text-lg font-semibold text-jkd-heading mb-4">Fundo e Imagem</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-2">
                      Cor de Fundo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={maintenanceSettings.backgroundColor}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          backgroundColor: e.target.value 
                        }))}
                        className="w-12 h-10 rounded border border-jkd-border"
                      />
                      <input
                        type="text"
                        value={maintenanceSettings.backgroundColor}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          backgroundColor: e.target.value 
                        }))}
                        className="flex-1 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-2">
                      Imagem de Fundo
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={maintenanceSettings.backgroundImage}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          backgroundImage: e.target.value 
                        }))}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="flex-1 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                      />
                      <label className="px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg hover:bg-jkd-bg-sec cursor-pointer flex items-center gap-2">
                        <Upload size={16} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => setBackgroundFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    {backgroundFile && (
                      <p className="text-xs text-green-600 mt-1">Nova imagem selecionada: {backgroundFile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-2">
                      Imagem de Sobreposição (Pattern/Overlay)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={maintenanceSettings.overlayImage}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          overlayImage: e.target.value 
                        }))}
                        placeholder="https://exemplo.com/overlay.png"
                        className="flex-1 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                      />
                      <label className="px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg hover:bg-jkd-bg-sec cursor-pointer flex items-center gap-2">
                        <Upload size={16} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => setOverlayFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-jkd-text mb-1">Opacidade do Overlay</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={maintenanceSettings.overlayOpacity}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          overlayOpacity: parseFloat(e.target.value) 
                        }))}
                        className="w-full"
                      />
                      <span className="text-xs text-jkd-text">{Math.round(maintenanceSettings.overlayOpacity * 100)}%</span>
                    </div>
                    {overlayFile && (
                      <p className="text-xs text-green-600 mt-1">Nova imagem de overlay selecionada: {overlayFile.name}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Configurações de Texto */}
            {!maintenanceSettings.redirectMode && (
              <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
                <h3 className="text-lg font-semibold text-jkd-heading mb-4">Configurações de Texto</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-2">Título</label>
                    <input
                      type="text"
                      value={maintenanceSettings.title}
                      onChange={(e) => setMaintenanceSettings(prev => ({ 
                        ...prev, 
                        title: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-jkd-heading mb-2">Tamanho</label>
                      <select
                        value={maintenanceSettings.titleSize}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          titleSize: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                      >
                        <option value="sm">Pequeno</option>
                        <option value="md">Médio</option>
                        <option value="lg">Grande</option>
                        <option value="xl">Extra Grande</option>
                        <option value="2xl">2x Grande</option>
                        <option value="3xl">3x Grande</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jkd-heading mb-2">Cor</label>
                      <input
                        type="color"
                        value={maintenanceSettings.titleColor}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          titleColor: e.target.value 
                        }))}
                        className="w-full h-10 rounded border border-jkd-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jkd-heading mb-2">Alinhamento</label>
                      <select
                        value={maintenanceSettings.titleAlign}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          titleAlign: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                      >
                        <option value="left">Esquerda</option>
                        <option value="center">Centro</option>
                        <option value="right">Direita</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jkd-heading mb-2">Mensagem</label>
                    <textarea
                      value={maintenanceSettings.message}
                      onChange={(e) => setMaintenanceSettings(prev => ({ 
                        ...prev, 
                        message: e.target.value 
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-jkd-heading mb-2">Tamanho</label>
                      <select
                        value={maintenanceSettings.messageSize}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          messageSize: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                      >
                        <option value="sm">Pequeno</option>
                        <option value="md">Médio</option>
                        <option value="lg">Grande</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jkd-heading mb-2">Cor</label>
                      <input
                        type="color"
                        value={maintenanceSettings.messageColor}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          messageColor: e.target.value 
                        }))}
                        className="w-full h-10 rounded border border-jkd-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-jkd-heading mb-2">Alinhamento</label>
                      <select
                        value={maintenanceSettings.messageAlign}
                        onChange={(e) => setMaintenanceSettings(prev => ({ 
                          ...prev, 
                          messageAlign: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                      >
                        <option value="left">Esquerda</option>
                        <option value="center">Centro</option>
                        <option value="right">Direita</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            {!maintenanceSettings.redirectMode && (
              <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-jkd-heading">Botões</h3>
                  <button
                    onClick={addButton}
                    className="px-3 py-1.5 bg-church-primary text-white rounded-lg hover:bg-church-primary/90 flex items-center gap-2 text-sm"
                  >
                    <Plus size={14} />
                    Adicionar Botão
                  </button>
                </div>

                <div className="space-y-3">
                  {maintenanceSettings.buttons.map((button) => (
                    <div key={button.id} className="border border-jkd-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-jkd-heading">Botão</h4>
                        <button
                          onClick={() => removeButton(button.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-jkd-heading mb-1">Texto</label>
                          <input
                            type="text"
                            value={button.text}
                            onChange={(e) => updateButton(button.id, { text: e.target.value })}
                            className="w-full px-2 py-1.5 border border-jkd-border rounded bg-jkd-bg text-jkd-text text-sm focus:outline-none focus:ring-1 focus:ring-church-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-jkd-heading mb-1">Link</label>
                          <input
                            type="url"
                            value={button.link}
                            onChange={(e) => updateButton(button.id, { link: e.target.value })}
                            className="w-full px-2 py-1.5 border border-jkd-border rounded bg-jkd-bg text-jkd-text text-sm focus:outline-none focus:ring-1 focus:ring-church-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-jkd-heading mb-1">Cor de Fundo</label>
                          <input
                            type="color"
                            value={button.backgroundColor}
                            onChange={(e) => updateButton(button.id, { backgroundColor: e.target.value })}
                            className="w-full h-7 rounded border border-jkd-border"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-jkd-heading mb-1">Cor do Texto</label>
                          <input
                            type="color"
                            value={button.textColor}
                            onChange={(e) => updateButton(button.id, { textColor: e.target.value })}
                            className="w-full h-7 rounded border border-jkd-border"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-jkd-heading mb-1">Borda</label>
                          <select
                            value={button.borderRadius}
                            onChange={(e) => updateButton(button.id, { borderRadius: e.target.value as any })}
                            className="w-full px-2 py-1.5 border border-jkd-border rounded bg-jkd-bg text-jkd-text text-sm focus:outline-none focus:ring-1 focus:ring-church-primary"
                          >
                            <option value="none">Nenhuma</option>
                            <option value="sm">Pequena</option>
                            <option value="md">Média</option>
                            <option value="lg">Grande</option>
                            <option value="full">Total</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {maintenanceSettings.buttons.length === 0 && (
                    <p className="text-sm text-jkd-text text-center py-4">Nenhum botão adicionado.</p>
                  )}
                </div>
              </div>
            )}

            {/* CSS Customizado */}
            {!maintenanceSettings.redirectMode && (
              <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
                <h3 className="text-lg font-semibold text-jkd-heading mb-4">CSS Customizado</h3>
                <textarea
                  value={maintenanceSettings.customCss}
                  onChange={(e) => setMaintenanceSettings(prev => ({ 
                    ...prev, 
                    customCss: e.target.value 
                  }))}
                  placeholder="/* CSS customizado aqui */"
                  rows={4}
                  className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-church-primary"
                />
                <p className="text-xs text-jkd-text mt-2">
                  Adicione estilos CSS personalizados. Use com cautela.
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-jkd-heading">Pré-visualização</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-3 py-1.5 rounded text-sm ${
                      previewMode === 'desktop' 
                        ? 'bg-church-primary text-white' 
                        : 'border border-jkd-border hover:bg-jkd-bg-sec'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1.5 rounded text-sm ${
                      previewMode === 'mobile' 
                        ? 'bg-church-primary text-white' 
                        : 'border border-jkd-border hover:bg-jkd-bg-sec'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <div className={`border-2 border-dashed border-jkd-border rounded-lg overflow-hidden ${
                previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
              }`}>
                {maintenanceSettings.redirectMode ? (
                  <div className="p-8 text-center">
                    <Link size={32} className="text-church-primary mx-auto mb-4" />
                    <h4 className="font-semibold text-jkd-heading mb-2">Modo Redirecionamento Ativo</h4>
                    <p className="text-sm text-jkd-text mb-4">
                      Os usuários serão redirecionados para:
                    </p>
                    <div className="bg-jkd-bg rounded p-3 text-sm font-mono break-all">
                      {maintenanceSettings.redirectUrl || 'URL não definida'}
                    </div>
                  </div>
                ) : (
                  <div 
                    className="min-h-[400px] flex flex-col justify-center items-center p-8 relative"
                    style={{
                      backgroundColor: maintenanceSettings.backgroundColor,
                      backgroundImage: maintenanceSettings.backgroundImage ? `url(${maintenanceSettings.backgroundImage})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {/* Overlay */}
                    {maintenanceSettings.overlayImage && (
                      <div 
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url(${maintenanceSettings.overlayImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          opacity: maintenanceSettings.overlayOpacity
                        }}
                      />
                    )}

                    {/* Content */}
                    <div className="relative z-10 text-center" style={{ alignItems: getTextAlign(maintenanceSettings.titleAlign) }}>
                      <h1 
                        className="font-bold mb-4"
                        style={{
                          fontSize: getFontSize(maintenanceSettings.titleSize),
                          color: maintenanceSettings.titleColor,
                          textAlign: maintenanceSettings.titleAlign
                        }}
                      >
                        {maintenanceSettings.title}
                      </h1>
                      <p 
                        className="mb-6"
                        style={{
                          fontSize: getFontSize(maintenanceSettings.messageSize),
                          color: maintenanceSettings.messageColor,
                          textAlign: maintenanceSettings.messageAlign
                        }}
                      >
                        {maintenanceSettings.message}
                      </p>

                      {/* Buttons */}
                      {maintenanceSettings.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-3 justify-center">
                          {maintenanceSettings.buttons.map((button) => (
                            <a
                              key={button.id}
                              href={button.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-2 font-medium transition-all hover:opacity-90"
                              style={{
                                backgroundColor: button.backgroundColor,
                                color: button.textColor,
                                borderRadius: getBorderRadius(button.borderRadius)
                              }}
                            >
                              {button.text}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceModeEditPage;