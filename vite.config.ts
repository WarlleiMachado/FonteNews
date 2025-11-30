import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        // Mantém desativado no dev para não interferir no fluxo normal
        enabled: false,
      },
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,mp3,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Ensure new service worker activates and updates clients immediately
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: 'Fonte de Vida',
        short_name: 'Fonte de Vida',
        description: 'Aplicativo da Igreja Fonte de Vida Laranjeiras',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        lang: 'pt-BR',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    watch: {
      // Ignora arquivos do snapshot para evitar reloads/transform de HTML/CSS externos
      ignored: ['**/versao-web-atual/**'],
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
