import React from 'react';
import LiderChatPrototypeApp from '../features/liderChatProto/LiderChatPrototypeApp';

const ChatPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-jkd-bg">
      {/* Renderiza o Líder-Chat ocupando toda a largura, sem cabeçalho duplicado */}
      <LiderChatPrototypeApp />
    </div>
  );
};

export default ChatPage;