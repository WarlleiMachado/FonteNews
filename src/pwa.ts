// Registro do Service Worker via vite-plugin-pwa
// Mantém comportamento discreto para não afetar o app web
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}