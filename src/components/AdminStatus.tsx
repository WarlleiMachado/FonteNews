import React, { useState, useEffect } from 'react';
import { ensureAdminUsers } from '../utils/ensureAdminUsers';

const AdminStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('Verificando...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminUsers = async () => {
      try {
        setIsLoading(true);
        setStatus('Verificando/criando líderes administradores...');
        
        const result = await ensureAdminUsers();
        
        if (result.success) {
          setStatus(`✅ Líderes administradores prontos!\n\n${result.message}`);
        } else {
          setStatus(`⚠️ Alguns problemas encontrados:\n\n${result.message}`);
        }
      } catch (error) {
        console.error('Erro ao verificar líderes administradores:', error);
        setStatus(`❌ Erro ao verificar líderes: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminUsers();
  }, []);

  return (
    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
      <h3 className="text-sm font-medium text-green-800 mb-2">
        Status dos Líderes Administradores
      </h3>
      <div className="text-xs text-green-700 whitespace-pre-line">
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
            Verificando líderes...
          </div>
        ) : (
          status
        )}
      </div>
    </div>
  );
};

export default AdminStatus;