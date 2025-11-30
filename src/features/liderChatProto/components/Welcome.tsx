import React from 'react';
import { MessageSquare } from 'lucide-react';

const Welcome: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-12 h-12 rounded-full bg-light-bg-muted dark:bg-dark-bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="w-6 h-6 text-light-text dark:text-dark-text" />
      </div>
      <h2 className="text-xl font-semibold text-light-heading dark:text-dark-heading">Selecione uma conversa</h2>
      <p className="mt-2 text-sm text-light-text dark:text-dark-text opacity-80 max-w-sm">
        Escolha um líder na lista à esquerda para começar. Suas conversas são privadas entre você e os participantes selecionados.
      </p>
    </div>
  );
};

export default Welcome;