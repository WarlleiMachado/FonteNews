import React, { useEffect, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { auth } from '../lib/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';


const Login: React.FC = () => {
  const { user, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const showModal = showRequestAccess || (!!error && (
    error.toLowerCase().includes('não foi autorizado') ||
    error.toLowerCase().includes('inativa') ||
    error.toLowerCase().includes('bloqueada')
  ));

  const { authorizedUsers, settings } = useApp();

  if (user) {
    // Redireciona conforme papel: admins ao dashboard, demais ao perfil
    const target = user.role === 'admin' ? '/dashboard' : '/profile';
    return <Navigate to={target} replace />;
  }

  // Concluir login quando abrir via link de e-mail
  useEffect(() => {
    const run = async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          let storedEmail = window.localStorage.getItem('emailForSignIn');
          if (!storedEmail) {
            storedEmail = window.prompt('Confirme seu e-mail para concluir o login') || '';
          }
          if (!storedEmail) return;

          await signInWithEmailLink(auth, storedEmail, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          setInfo('Login concluído com sucesso.');
        }
      } catch (err: any) {
        console.error('Erro ao concluir login por link:', err);
        setError('Não foi possível concluir o login. O link pode estar expirado ou inválido. Solicite um novo link.');
      }
    };
    run();
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    const result = await loginWithGoogle();
    if (!result.success) {
      setError(result.message || 'Erro no login com Google.');
    }
  };

  const handlePrecheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setShowRequestAccess(false);

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Informe seu e-mail para continuar.');
      return;
    }

    const match = authorizedUsers.find(u => (u.email || '').toLowerCase() === normalizedEmail);
    if (!match) {
      setError('Seu e-mail não foi localizado no sistema de liderança autorizada e nem nos arquivos de dados autorizados. Por gentileza, solicite autorização ou fale com a secretaria (secretaria.adfdevidalaranjeiras@gmail.com).');
      setShowRequestAccess(true);
      setEmailChecked(false);
      return;
    }

    if (match.status === 'blocked') {
      setError('Sua conta está bloqueada. Por gentileza, procure a secretaria da Igreja Fonte de Vida Laranjeiras para regularização ou maiores informações.');
      setEmailChecked(false);
      return;
    }

    if (match.status === 'inactive') {
      setError('Sua conta está inativa. Por gentileza, fale com a secretaria da Igreja Fonte de Vida Laranjeiras para ativação do acesso.');
      setEmailChecked(false);
      return;
    }

    setInfo('E-mail autorizado. Você pode continuar abaixo para receber o link de acesso.');
    setEmailChecked(true);
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const normalizedEmail = (email || '').trim();
    if (!normalizedEmail) {
      setError('Informe seu e-mail para receber o link de acesso.');
      return;
    }
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      } as any;

      await sendSignInLinkToEmail(auth, normalizedEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', normalizedEmail);
      setInfo('Enviamos um link de acesso para seu e-mail. Abra o link no mesmo dispositivo para finalizar o login.');
    } catch (err: any) {
      console.error('Erro ao enviar link de acesso:', err);
      if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido. Corrija e tente novamente.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Método "Link de e-mail" está desabilitado. Ative em Firebase Authentication.');
      } else {
        setError('Não foi possível enviar o link agora. Tente novamente mais tarde.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-jkd-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src={settings.logoUrl}
            alt="Logo Igreja"
            className="h-16 w-auto mx-auto mb-4"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x100/ff652c/ffffff?text=FONTE+NEWS'; }}
          />
          <h2 className="text-3xl font-bold text-jkd-heading">Área do Líder</h2>
          <p className="mt-2 text-jkd-text">Entre na sua conta para gerenciar as programações.</p>
        </div>

        <div className="bg-jkd-bg-sec rounded-lg shadow-sm border border-jkd-border p-8">
          <form onSubmit={handlePrecheckEmail} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-jkd-heading mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jkd-text" size={18} />
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text placeholder-jkd-text/60 focus:outline-none focus:ring-2 focus:ring-church-primary focus:border-transparent"
                  placeholder="seu@email.com" />
              </div>
            </div>

            {info && (
              <div className="text-green-700 text-sm text-left bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                {info}
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm text-left bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <span>{error}</span>
                  <Link to="/request-access" className="mt-2 block font-semibold text-church-primary hover:underline">
                    Solicitar Autorização
                  </Link>
                </div>
              </div>
            )}

            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white dark:bg-jkd-bg w-[92%] max-w-md rounded-lg shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-jkd-heading mb-3">
                    {showRequestAccess ? 'Solicitar acesso' : (error.toLowerCase().includes('bloqueada') ? 'Conta bloqueada' : 'Conta inativa')}
                  </h3>
                  <div className="text-sm text-jkd-text mb-4">
                    {showRequestAccess && (
                      <p>
                        Seu acesso não foi autorizado. Para solicitar autorização, preencha o formulário.
                        Você será notificado quando sua solicitação for analisada pela secretaria.
                      </p>
                    )}
                    {!showRequestAccess && error.toLowerCase().includes('bloqueada') && (
                      <p>
                        Sua conta está bloqueada. Por gentileza, procure a secretaria da Igreja Fonte de Vida Laranjeiras para regularização ou maiores informações.
                      </p>
                    )}
                    {!showRequestAccess && error.toLowerCase().includes('inativa') && (
                      <p>
                        Sua conta está inativa. Por gentileza, fale com a secretaria da Igreja Fonte de Vida Laranjeiras para ativação do acesso.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    {showRequestAccess && (
                      <Link to="/request-access" className="px-3 py-2 rounded-md bg-church-primary text-white hover:opacity-90">
                        Abrir formulário
                      </Link>
                    )}
                    <button
                      type="button"
                      className="px-3 py-2 rounded-md border border-jkd-border text-jkd-text hover:bg-jkd-bg/60"
                      onClick={() => { setShowRequestAccess(false); setError(''); }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-church-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-church-primary/90 focus:outline-none focus:ring-2 focus:ring-church-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isLoading ? 'Validando...' : 'Entrar com email'}
            </button>
          </form>

          {emailChecked && (
            <div className="mt-8">
              <form onSubmit={handleSendLink} className="space-y-4">
                <div>
                  <label htmlFor="emailLogin" className="block text-sm font-medium text-jkd-heading mb-2">Email para receber o link</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-jkd-text" size={18} />
                    <input id="emailLogin" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-jkd-border rounded-lg bg-jkd-bg text-jkd-text placeholder-jkd-text/60 focus:outline-none focus:ring-2 focus:ring-church-primary focus:border-transparent"
                      placeholder="seu@email.com" />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full bg-church-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-church-primary/90 focus:outline-none focus:ring-2 focus:ring-church-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {isLoading ? 'Enviando...' : 'Enviar link de acesso'}
                </button>
                <p className="mt-3 text-xs text-jkd-text">
                  Após o link ser enviado verifique sua caixa de Entrada, ou considere pesquisar por Fonte News, o link de acesso talvez possa ir para a pasta de Promoções ou Spam.
                </p>
              </form>

              <div className="mt-6">
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-jkd-border" /></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-jkd-bg-sec text-jkd-text">ou</span></div></div>
                <button onClick={handleGoogleLogin} disabled={isLoading} className="mt-4 w-full bg-white border border-jkd-border text-jkd-text py-2 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-church-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span>Continuar com Google</span>
                </button>
              </div>
            </div>
          )}

          {/* CTA permanente para solicitação de autorização */}
          <div className="mt-6 p-4 rounded-lg border border-jkd-border bg-jkd-bg-sec">
            <h3 className="text-md font-semibold text-jkd-heading mb-2">Não tem autorização?</h3>
            <p className="text-sm text-jkd-text mb-3">
              Se você ainda não tem acesso, solicite autorização preenchendo o formulário.
            </p>
            <Link to="/request-access" className="inline-block px-4 py-2 rounded-md bg-church-primary text-white hover:bg-church-primary/90">
              Solicitar Autorização
            </Link>
          </div>

          
        </div>


        <div className="text-center"><Link to="/" className="text-church-primary hover:text-church-primary/80 font-medium">← Voltar para o início</Link></div>
      </div>
    </div>
  );
};

export default Login;
