import React from 'react';
import LiderChatPrototypeApp from '../../features/liderChatProto/LiderChatPrototypeApp';

const LiderChatPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Usa a UI do protótipo com integração real */}
      <LiderChatPrototypeApp />
    </div>
  );
};

export default LiderChatPage;