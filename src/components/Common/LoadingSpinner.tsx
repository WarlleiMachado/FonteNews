import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Carregando, por favor aguarde...', 
  size = 'large' 
}) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const containerClasses = {
    small: 'p-4',
    medium: 'p-8',
    large: 'h-screen'
  };

  return (
    <div className={`flex flex-col justify-center items-center ${containerClasses[size]}`}>
      {/* Spinner animado */}
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-4 border-b-4 border-church-primary mb-4`}>
        <div className="sr-only">Carregando...</div>
      </div>
      
      {/* Mensagem de carregamento */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {message}
        </h2>
        <div className="flex space-x-1 justify-center">
          <div className="w-2 h-2 bg-church-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-church-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-church-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;