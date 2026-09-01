import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // Register from src/pwa/registerUpdates.ts so a new worker can
        // reload the page. injectRegister: 'auto' would double-register.
        injectRegister: false,
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'Tippy Wira Hijau',
          short_name: 'Tippy',
          description:
            'An interactive climate adventure storybook for children aged 4-8.',
          lang: 'en',
          theme_color: '#10b981',
          background_color: '#020617',
          // iOS only honours `standalone`; display_override still gives
          // Android the status-bar-free fullscreen experience.
          display: 'standalone',
          display_override: ['fullscreen', 'standalone'],
          orientation: 'landscape',
          // Generic fallback only. Personalised installs come from
          // /u/{access_code}, which serves /api/manifest?access_code=... instead and
          // sets start_url to /launch/{access_code}. Keep both manifests in sync
          // with server/manifest.ts.
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Precache the app shell; keep large media out of the precache.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: '/index.html',
          // /u/{access_code} must reach Express for the per-child manifest link.
          // Parent portal (/dashboard) uses the normal SPA shell via navigateFallback.
          navigateFallbackDenylist: [/^\/api\//, /^\/u\//],
          runtimeCaching: [
            {
              // Child lookup, per-child manifest, and /api/status (maintenance)
              // must never come from the SW cache.
              urlPattern: ({url}) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
            {
              // Cache story media on demand. Match by file extension as well
              // as destination: the loading-screen preloader uses fetch(),
              // whose request.destination is empty, so a destination-only
              // rule never stored the mp4s.
              urlPattern: ({url, request}) =>
                request.destination === 'video' ||
                request.destination === 'audio' ||
                /\.(mp4|webm|mov|mp3|wav|m4a|ogg)$/i.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'tippy-media',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                rangeRequests: true,
                cacheableResponse: {statuses: [0, 200]},
              },
            },
            {
              // Cache character GIFs / background images on demand.
              urlPattern: ({request}) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'tippy-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {statuses: [0, 200]},
              },
            },
          ],
        },
        // Service worker is disabled in dev to avoid caching during development.
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify-file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
