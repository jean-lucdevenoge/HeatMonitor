import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-16x16-v4.png', 'favicon-32x32-v4.png', 'apple-touch-icon-v4.png'],
      manifest: {
        name: 'Heating System Dashboard',
        short_name: 'Heating Dashboard',
        description: 'Monitor your solar and gas heating system with real-time analytics, energy charts, and house heating insights.',
        id: '/heating-dashboard-v4',
        theme_color: '#f97316',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192-v4.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512-v4.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-maskable-512x512-v4.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workboxConfig: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  optimizeDeps: {
    include: ['lucide-react'],
  },
});
