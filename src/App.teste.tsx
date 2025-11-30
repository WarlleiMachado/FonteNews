import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { ThemeProvider } from './contexts/ThemeContext';
// import { AuthProvider } from './contexts/AuthContext';
// import { AppProvider } from './contexts/AppContext';
// import { ToastProvider } from './contexts/ToastContext';
// ... TODO O SEU APP ANTIGO COMENTADO ...

import TesteDelete from './TesteDelete'; // Importe o novo componente

function App() {
  return (
    <div>
      {/* 
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <AppProvider>
                  <AppContent />
                </AppProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
        ... TODO O SEU APP ANTIGO COMENTADO ... 
      */}
      
      <TesteDelete />
      
    </div>
  );
}

export default App;
