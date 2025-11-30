export const env = {
  DISABLE_FIREBASE: (import.meta as any)?.env?.VITE_DISABLE_FIREBASE === 'true',
  FORCE_MAINTENANCE: (import.meta as any)?.env?.VITE_FORCE_MAINTENANCE === 'true',
  BACKEND_URL: (import.meta as any)?.env?.VITE_BACKEND_URL || '',
};

export const isFirebaseEnabled = () => !env.DISABLE_FIREBASE;
