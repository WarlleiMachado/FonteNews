import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback defensivo: evitar crash quando o provider não estiver disponível
    console.error('useAuth: AuthProvider não encontrado no tree. Retornando fallback.');
    return {
      user: null,
      firebaseUser: null,
      isLoading: false,
      login: async () => ({ success: false, message: 'Autenticação indisponível. Atualize a página.' }),
      loginWithGoogle: async () => ({ success: false, message: 'Autenticação indisponível. Atualize a página.' }),
      logout: () => {},
      updateUser: () => {}
    } as AuthContextType;
  }
  return context;
};
