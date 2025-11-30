import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const AdminLoginButton: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdminLogin = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('🔐 Tentando login com Google para administrador...');
      const result = await loginWithGoogle();
      
      if (result.success) {
        setMessage('✅ Login realizado com sucesso!');
        console.log('✅ Login de administrador bem-sucedido');
      } else {
        setMessage(`❌ Erro no login: ${result.message}`);
        console.error('❌ Erro no login de administrador:', result.message);
      }
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      setMessage('❌ Erro inesperado no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-sm font-medium text-blue-800 mb-2">
        Teste de Login para Administradores
      </h3>
      <p className="text-xs text-blue-600 mb-3">
        Use este botão para testar o login com Google usando uma conta de administrador.
      </p>
      <button
        onClick={handleAdminLogin}
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isLoading ? 'Fazendo login...' : 'Testar Login Admin com Google'}
      </button>
      {message && (
        <div className="mt-2 text-xs">
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminLoginButton;