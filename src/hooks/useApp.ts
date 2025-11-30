import { useContext } from 'react';
import { AppContext, AppContextType } from '../contexts/AppContext';

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};
