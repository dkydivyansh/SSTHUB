import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false, // Using our existing site.webmanifest
        workbox: {
          globPatterns: ['**/*.{js,css,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 10485760, // 10 MiB limit
          runtimeCaching: [
            {
              // Cache root and React routing paths as NetworkFirst so updates aren't stuck behind StaleWhileRevalidate
              urlPattern: ({ request, url }) => request.mode === 'navigate' || url.pathname === '/',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'html-cache',
                networkTimeoutSeconds: 3, // Fallback to cache quickly if offline
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                },
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost',
        '/auth': 'http://localhost',
        '/testlogin': 'http://localhost'
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
