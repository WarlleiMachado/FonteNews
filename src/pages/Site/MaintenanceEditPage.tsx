import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMaintenance } from '../../contexts/MaintenanceContext';
import { useToast } from '../../contexts/ToastContext';
import MaintenancePage from './MaintenancePage';
import { 
  Save, 
  Upload, 
  Plus, 
  Trash2, 
  Palette, 
  Type, 
  Image, 
  Link, 
  Clock,
  Code,
  Eye,
  RotateCcw,
  Download,
  UploadCloud
} from 'lucide-react';
import { MaintenanceButton } from '../../types/maintenance';

const MaintenanceEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { config, updateConfig, resetConfig, uploadHeaderImage, uploadHeaderImageFromBase64, deleteHeaderImage } = useMaintenance();
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'buttons' | 'advanced'>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [tempHeaderImageUrl, setTempHeaderImageUrl] = useState(config.headerImageUrl);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isUserTyping, setIsUserTyping] = useState(false); // Flag para controlar sincronização

  // Sincronizar estado temporário quando a config mudar externamente
  // Mas NÃO sincronizar se o usuário estiver digitando
  React.useEffect(() => {
    if (!isUserTyping && config.headerImageUrl !== tempHeaderImageUrl) {
      console.log('[MaintenanceEditPage] headerImageUrl mudou externamente:', config.headerImageUrl);
      setTempHeaderImageUrl(config.headerImageUrl);
    }
  }, [config.headerImageUrl, isUserTyping, tempHeaderImageUrl]);

  const handleSave = async () => {
    if (isSaving) return; // Prevenir duplo clique
    
    try {
      console.log('[MaintenanceEditPage] Iniciando salvamento de configurações...');
      setIsSaving(true);
      
      // Forçar atualização e salvamento das configurações
      await updateConfig({});
      
      console.log('[MaintenanceEditPage] Configurações salvas com sucesso!');
      showToast('success', 'Configurações salvas com sucesso!');
      
    } catch (error: any) {
      console.error('[MaintenanceEditPage] Erro ao salvar configurações:', error);
      
      let errorMessage = 'Erro ao salvar configurações. ';
      
      if (error.message?.includes('Usuário não autenticado')) {
        errorMessage += 'Por favor, faça login novamente.';
      } else if (error.message?.includes('Permissão negada')) {
        errorMessage += 'Você não tem permissão para salvar configurações.';
      } else if (error.message?.includes('Falha ao salvar')) {
        errorMessage += 'Tente novamente em alguns segundos.';
      } else {
        errorMessage += error.message || 'Erro desconhecido.';
      }
      
      showToast('error', errorMessage);
      
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Tem certeza que deseja redefinir todas as configurações para o padrão?')) {
      await resetConfig();
      showToast('Configurações redefinidas para o padrão', 'info');
    }
  };

  const handleHeaderImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          console.log('[MaintenanceEditPage] 📤 Iniciando upload do header image...');
          setIsSaving(true);
          
          // Usar o novo serviço de upload
          const imageUrl = await uploadHeaderImage(file);
          
          console.log('[MaintenanceEditPage] ✅ Upload concluído:', imageUrl);
          showToast('success', 'Imagem do cabeçalho enviada com sucesso!');
          
          // Atualizar o estado temporário
          setTempHeaderImageUrl(imageUrl);
          
        } catch (error: any) {
          console.error('[MaintenanceEditPage] ❌ Erro ao fazer upload:', error);
          
          let errorMessage = 'Erro ao enviar imagem. ';
          
          if (error.message?.includes('Tipo de arquivo inválido')) {
            errorMessage += 'Use apenas JPG, PNG, GIF ou WebP.';
          } else if (error.message?.includes('muito grande')) {
            errorMessage += 'A imagem deve ter no máximo 5MB.';
          } else if (error.message?.includes('não autenticado')) {
            errorMessage += 'Faça login novamente.';
          } else {
            errorMessage += error.message || 'Tente novamente.';
          }
          
          showToast('error', errorMessage);
        } finally {
          setIsSaving(false);
        }
      }
    };
    input.click();
  };

  const handleImageUpload = (type: 'background' | 'overlay' | 'logo') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          if (type === 'background') {
            updateConfig({ backgroundImage: imageUrl });
          } else if (type === 'overlay') {
            updateConfig({ overlayImage: imageUrl });
          } else if (type === 'logo') {
            updateConfig({ logoUrl: imageUrl });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const addButton = () => {
    const newButton: MaintenanceButton = {
      id: Date.now().toString(),
      text: 'Novo Botão',
      url: 'https://',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      showButton: true,
    };
    updateConfig({ buttons: [...config.buttons, newButton] });
  };

  const updateButton = (id: string, updates: Partial<MaintenanceButton>) => {
    const updatedButtons = config.buttons.map(btn => 
      btn.id === id ? { ...btn, ...updates } : btn
    );
    updateConfig({ buttons: updatedButtons });
  };

  const removeButton = (id: string) => {
    const updatedButtons = config.buttons.filter(btn => btn.id !== id);
    updateConfig({ buttons: updatedButtons });
  };

  // Função de debounce para salvar headerImageUrl
  const debouncedUpdateHeaderImageUrl = (url: string) => {
    // Cancelar timer anterior se existir
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Criar novo timer
    const timer = setTimeout(() => {
      console.log('[MaintenanceEditPage] Debounce: Salvando headerImageUrl:', url);
      updateConfig({ headerImageUrl: url });
    }, 1000); // Esperar 1 segundo após o usuário parar de digitar
    
    setDebounceTimer(timer);
  };

  // Limpar timer quando o componente desmontar
  React.useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maintenance-config.json';
    link.click();
  };

  const importConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedConfig = JSON.parse(e.target?.result as string);
            updateConfig(importedConfig);
            showToast('Configuração importada com sucesso!', 'success');
          } catch (error) {
            showToast('Erro ao importar configuração', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (previewMode) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute top-4 right-4 z-[10000] pointer-events-auto">
          <button
            onClick={() => setPreviewMode(false)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
          >
            Sair do Preview
          </button>
        </div>
        {/* Preview fullscreen que mostra exatamente como o usuário veria */}
        <div className="w-full h-full">
          <MaintenancePage isPreview={true} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/site/gerenciamento')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Editor - Modo Manutenção</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportConfig}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Download size={16} />
                Exportar
              </button>
              <button
                onClick={importConfig}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <UploadCloud size={16} />
                Importar
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:text-orange-700 transition-colors"
              >
                <RotateCcw size={16} />
                Resetar
              </button>
              <button
                onClick={() => setPreviewMode(true)}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Eye size={16} />
                Preview
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={16} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'content', label: 'Conteúdo', icon: Type },
                { id: 'design', label: 'Design', icon: Palette },
                { id: 'buttons', label: 'Botões', icon: Link },
                { id: 'advanced', label: 'Avançado', icon: Code },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Aba Conteúdo */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => updateConfig({ title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Estamos em Manutenção"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                  <textarea
                    value={config.description}
                    onChange={(e) => updateConfig({ description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrição detalhada..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alinhamento do Conteúdo</label>
                    <select
                      value={config.contentAlignment}
                      onChange={(e) => updateConfig({ contentAlignment: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="left">Esquerda</option>
                      <option value="center">Centro</option>
                      <option value="right">Direita</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alinhamento Vertical</label>
                    <select
                      value={config.verticalAlignment}
                      onChange={(e) => updateConfig({ verticalAlignment: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="top">Topo</option>
                      <option value="center">Centro</option>
                      <option value="bottom">Fundo</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.showCountdown}
                      onChange={(e) => updateConfig({ showCountdown: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Mostrar contador regressivo</span>
                  </label>
                </div>

                {config.showCountdown && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data do contador</label>
                    <input
                      type="date"
                      value={config.countdownDate}
                      onChange={(e) => updateConfig({ countdownDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Aba Design */}
            {activeTab === 'design' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagem de Fundo</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={config.backgroundImage}
                        onChange={(e) => updateConfig({ backgroundImage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="URL da imagem"
                      />
                      <button
                        onClick={() => handleImageUpload('background')}
                        className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors w-full justify-center"
                      >
                        <Upload size={16} />
                        Upload de Imagem
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Fundo</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.backgroundColor}
                        onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagem de Sobreposição</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={config.overlayImage}
                        onChange={(e) => updateConfig({ overlayImage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="URL da imagem (pattern)"
                      />
                      <button
                        onClick={() => handleImageUpload('overlay')}
                        className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors w-full justify-center"
                      >
                        <Upload size={16} />
                        Upload de Imagem
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opacidade da Sobreposição</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.overlayOpacity}
                      onChange={(e) => updateConfig({ overlayOpacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{config.overlayOpacity}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho do Título</label>
                    <select
                      value={config.titleSize}
                      onChange={(e) => updateConfig({ titleSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="xs">Extra Pequeno</option>
                      <option value="sm">Pequeno</option>
                      <option value="base">Normal</option>
                      <option value="lg">Grande</option>
                      <option value="xl">Extra Grande</option>
                      <option value="2xl">2x Grande</option>
                      <option value="3xl">3x Grande</option>
                      <option value="4xl">4x Grande</option>
                      <option value="5xl">5x Grande</option>
                      <option value="6xl">6x Grande</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Título</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.titleColor}
                        onChange={(e) => updateConfig({ titleColor: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.titleColor}
                        onChange={(e) => updateConfig({ titleColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peso do Título</label>
                    <select
                      value={config.titleWeight}
                      onChange={(e) => updateConfig({ titleWeight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Médio</option>
                      <option value="semibold">Semi Negrito</option>
                      <option value="bold">Negrito</option>
                      <option value="extrabold">Extra Negrito</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho da Descrição</label>
                    <select
                      value={config.descriptionSize}
                      onChange={(e) => updateConfig({ descriptionSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="xs">Extra Pequeno</option>
                      <option value="sm">Pequeno</option>
                      <option value="base">Normal</option>
                      <option value="lg">Grande</option>
                      <option value="xl">Extra Grande</option>
                      <option value="2xl">2x Grande</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor da Descrição</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={config.descriptionColor}
                        onChange={(e) => updateConfig({ descriptionColor: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.descriptionColor}
                        onChange={(e) => updateConfig({ descriptionColor: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peso da Descrição</label>
                    <select
                      value={config.descriptionWeight}
                      onChange={(e) => updateConfig({ descriptionWeight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Médio</option>
                      <option value="semibold">Semi Negrito</option>
                      <option value="bold">Negrito</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Largura Máxima do Container</label>
                    <select
                      value={config.containerMaxWidth}
                      onChange={(e) => updateConfig({ containerMaxWidth: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="sm">Pequeno</option>
                      <option value="md">Médio</option>
                      <option value="lg">Grande</option>
                      <option value="xl">Extra Grande</option>
                      <option value="2xl">2x Grande</option>
                      <option value="3xl">3x Grande</option>
                      <option value="4xl">4x Grande</option>
                      <option value="5xl">5x Grande</option>
                      <option value="6xl">6x Grande</option>
                      <option value="7xl">7x Grande</option>
                      <option value="full">Tela Cheia</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.textShadow}
                        onChange={(e) => updateConfig({ textShadow: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Sombra no Texto</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.backdropBlur}
                        onChange={(e) => updateConfig({ backdropBlur: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Desfoque do Fundo</span>
                    </label>
                  </div>
                </div>

                {/* NOVA SEÇÃO DE HEADER IMAGE */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-800 flex items-center">
                    <Image className="mr-2 h-5 w-5" />
                    Imagem de Cabeçalho
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL da Imagem de Cabeçalho</label>
                      <input
                        type="text"
                        value={tempHeaderImageUrl}
                        onChange={(e) => {
                          // Marcar que o usuário está digitando
                          setIsUserTyping(true);
                          
                          // Atualizar estado temporário
                          setTempHeaderImageUrl(e.target.value);
                          
                          // Usar debounce para salvar
                          debouncedUpdateHeaderImageUrl(e.target.value);
                        }}
                        onBlur={(e) => {
                          // Marcar que o usuário parou de digitar
                          setIsUserTyping(false);
                          
                          // Salvar imediatamente quando sair do campo
                          if (debounceTimer) {
                            clearTimeout(debounceTimer);
                          }
                          updateConfig({ headerImageUrl: e.target.value });
                        }}
                        onKeyPress={(e) => {
                          // Salvar ao pressionar Enter
                          if (e.key === 'Enter') {
                            setIsUserTyping(false);
                            if (debounceTimer) {
                              clearTimeout(debounceTimer);
                            }
                            updateConfig({ headerImageUrl: e.currentTarget.value });
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://exemplo.com/imagem.png"
                      />
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleHeaderImageUpload}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        disabled={isSaving}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {isSaving ? 'Enviando...' : 'Upload de Imagem'}
                      </button>
                      
                      {tempHeaderImageUrl && (
                        <button
                          onClick={async () => {
                            try {
                              setIsSaving(true);
                              await deleteHeaderImage();
                              setTempHeaderImageUrl('');
                              showToast('success', 'Imagem removida com sucesso!');
                            } catch (error) {
                              console.error('Erro ao remover imagem:', error);
                              showToast('error', 'Erro ao remover imagem');
                            } finally {
                              setIsSaving(false);
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                          disabled={isSaving}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </button>
                      )}
                    </div>

                    {tempHeaderImageUrl && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <div className="flex justify-center">
                          <img
                            src={tempHeaderImageUrl}
                            alt="Preview Header"
                            className="max-h-24 max-w-full rounded-lg shadow-md"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Aba Botões */}
            {activeTab === 'buttons' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Botões de Ação</h3>
                  <button
                    onClick={addButton}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Adicionar Botão
                  </button>
                </div>

                {config.buttons.map((button, index) => (
                  <div key={button.id} className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Botão {index + 1}</h4>
                      <button
                        onClick={() => removeButton(button.id)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Texto do Botão</label>
                        <input
                          type="text"
                          value={button.text}
                          onChange={(e) => updateButton(button.id, { text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">URL do Botão</label>
                        <input
                          type="url"
                          value={button.url}
                          onChange={(e) => updateButton(button.id, { url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Fundo</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={button.backgroundColor}
                            onChange={(e) => updateButton(button.id, { backgroundColor: e.target.value })}
                            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={button.backgroundColor}
                            onChange={(e) => updateButton(button.id, { backgroundColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cor do Texto</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={button.textColor}
                            onChange={(e) => updateButton(button.id, { textColor: e.target.value })}
                            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={button.textColor}
                            onChange={(e) => updateButton(button.id, { textColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={button.showButton}
                            onChange={(e) => updateButton(button.id, { showButton: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Mostrar</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Aba Avançado */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CSS Customizado</label>
                  <textarea
                    value={config.customCSS}
                    onChange={(e) => updateConfig({ customCSS: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="/* CSS customizado aqui */"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Adicione estilos CSS personalizados. Use com cautela!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceEditPage;