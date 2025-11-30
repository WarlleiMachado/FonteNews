import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Save, User, Image, UploadCloud, ArrowLeft, X, MessageCircle, Cog } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { uploadUserAvatar } from '../services/uploadService';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { updateAuthorizedUser } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  if (!user) {
    return <p>Carregando...</p>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    let finalAvatarUrl = formData.avatarUrl;
    
    // Se há um arquivo de avatar, fazer upload para o Firebase Storage
    if (avatarFile) {
        try {
            finalAvatarUrl = await uploadUserAvatar(avatarFile, user.id);
        } catch (error) {
            console.error('Erro no upload da foto:', error);
            setError(`Erro no upload da foto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            setIsSubmitting(false);
            return;
        }
    }
    
    // Atualiza o contexto global de usuários autorizados
    await updateAuthorizedUser(user.id, {
      name: formData.name,
      avatarUrl: finalAvatarUrl,
    });

    // Atualiza o contexto de autenticação local
    updateUser({
      name: formData.name,
      avatarUrl: finalAvatarUrl,
    });

    setIsSubmitting(false);
    navigate('/dashboard');
  };

  const handleAvatarUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, avatarUrl: url }));
    if (url) {
      setAvatarFile(null);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setFormData(prev => ({ ...prev, avatarUrl: '' }));
    }
  };

  const handleManageCookies = () => {
    try { localStorage.removeItem('cookie_consent_preferences'); } catch {}
    window.dispatchEvent(new Event('open-cookie-consent'));
  };

  const handleGoToChat = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-jkd-bg py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            to="/dashboard"
            className="inline-flex items-center space-x-2 text-church-primary hover:text-church-primary/80 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Voltar ao Painel</span>
          </Link>
          <h1 className="text-3xl font-bold text-jkd-heading">Meu Perfil</h1>
          <p className="text-jkd-text mt-1">Atualize suas informações pessoais.</p>
        </div>

        <div className="bg-jkd-bg-sec rounded-lg border border-jkd-border p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-jkd-bg border-2 border-jkd-border flex items-center justify-center overflow-hidden">
                {avatarFile ? (
                  <img 
                    src={URL.createObjectURL(avatarFile)} 
                    alt="Avatar Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Usuário')}&background=ff652c&color=fff`}
                    alt="Inicial do usuário"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-jkd-heading mb-2">
                <div className="flex items-center space-x-2"><User size={16} /><span>Nome</span></div>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
              />
            </div>

            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-jkd-heading mb-2">
                <div className="flex items-center space-x-2"><Image size={16} /><span>URL da Foto de Perfil</span></div>
                <p className="text-xs text-jkd-text/70">Tamanho máximo: <strong>5MB</strong>.</p>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  id="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={(e) => handleAvatarUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text focus:outline-none focus:ring-2 focus:ring-church-primary"
                  placeholder="https://exemplo.com/foto.jpg"
                />
                <div>
                  <label className="block text-sm font-medium text-jkd-text mb-2">
                    Ou faça upload de uma foto
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-church-primary text-white rounded-lg cursor-pointer hover:bg-church-primary/90 transition-colors"
                    >
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Escolher Arquivo
                    </label>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={() => setAvatarFile(null)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {avatarFile && (
                    <p className="text-sm text-jkd-text-muted mt-2">
                      Arquivo selecionado: {avatarFile.name}
                    </p>
                  )}
                  <p className="text-xs text-jkd-text-muted mt-1">
                    PNG, JPG até 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <Link to="/dashboard" className="px-4 py-2 text-jkd-text hover:text-church-primary">Cancelar</Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center space-x-2 bg-church-primary text-white px-6 py-2 rounded-lg hover:bg-church-primary/90 disabled:opacity-50"
              >
                <Save size={20} />
                <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-jkd-border mt-4">
              <button
                type="button"
                onClick={handleManageCookies}
                className="inline-flex items-center gap-2 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text hover:bg-jkd-border/30"
                title="Gerenciar Cookies"
              >
                <Cog size={16} />
                <span>Gerenciar Cookies</span>
              </button>
              <button
                type="button"
                onClick={handleGoToChat}
                className="inline-flex items-center gap-2 px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text hover:bg-jkd-border/30"
                title="Ir para Chat"
              >
                <MessageCircle size={16} />
                <span>Ir para Chat</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
