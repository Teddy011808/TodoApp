/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Caching strategies — one rule per kind of request, and why it earns it:
//
//  App shell (JS, CSS, HTML, icons) → PRECACHE
//    Built files have content hashes in their names, so a cached copy can
//    never be stale; precaching them is what lets the app open with no signal.
//
//  Avatar images → CACHE FIRST
//    Every upload gets a new ?v=<timestamp> URL, so the bytes behind any one
//    URL never change — there is nothing to gain by asking the network again.
//
//  Supabase data (GET /rest/v1) → NETWORK FIRST, 4s timeout
//    Habits change and must be fresh when online, but on a train the last
//    known list beats an error. Writes (POST/PATCH/DELETE) are never cached.
//
//  Supabase auth (/auth/v1) → NETWORK ONLY
//    Tokens and sessions must never be served from a cache.
//
//  Directory API (jsonplaceholder) → STALE WHILE REVALIDATE
//    Public, rarely-changing demo data: show the cached copy instantly and
//    refresh it in the background for next time.
//
// Each urlPattern is copied into sw.js as SOURCE TEXT, so it must be
// self-contained: a constant defined up here would not exist in the worker.

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The new service worker WAITS until the user clicks Refresh in the
      // UpdateToast, instead of swapping code under a running page.
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'pwa-icon.svg'],
      manifest: {
        id: '/',
        name: 'React Workshop Habits',
        short_name: 'Habits',
        description: 'Build small daily habits — works offline and installs on your phone.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Any in-app URL opened offline (a deep link, a refresh on /habits)
        // gets the cached shell; React Router takes it from there.
        navigateFallback: '/index.html',
        // The JS bundle is ~500 KB; raise the default 2 MiB guard a little
        // so it can never be silently left out of the precache.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/storage/v1/object/public/avatars/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'avatars',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/v1/'),
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/auth/v1/'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://jsonplaceholder.typicode.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'directory-api',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // No service worker on the dev server: offline behaviour is only ever
      // tested against `npm run build && npm run preview`.
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // The plugin's virtual module needs a real service worker; tests get a stub.
    alias: {
      'virtual:pwa-register/react': new URL('./src/test/pwaRegisterStub.ts', import.meta.url).pathname,
    },
  },
})
