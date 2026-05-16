import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/coffee_tracker/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Coffee Tracker',
        short_name: 'Coffee',
        description: 'Track your coffee brews, beans, and grinder settings',
        theme_color: '#2d1f0e',
        background_color: '#1a1008',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/coffee_tracker/',
        scope: '/coffee_tracker/',
        icons: [
          {
            src: '/coffee_tracker/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/coffee_tracker/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'runtime-cache' },
          },
        ],
      },
    }),
  ],
});
