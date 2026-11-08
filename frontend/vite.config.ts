import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

const isSingleFile = !!process.env.VITE_SINGLE_FILE;

export default defineConfig({
  plugins: [
    react(),
    ...(isSingleFile ? [] : [
    VitePWA({
      // SW 등록은 main.tsx에서 push-sw.js로 직접 처리
      // VitePWA는 manifest 생성 + 프로덕션 빌드용으로만 사용
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: '꾸물 — 꾸물대지 말고, 지금 시작',
        short_name: '꾸물',
        description: '꾸물대지 말고, 지금 시작',
        theme_color: '#6366F1',
        background_color: '#0A0A0A',
        display: 'standalone',
        scope: '/',
        start_url: '/',
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
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      devOptions: {
        enabled: false,
      },
    })]),
    ...(isSingleFile ? [viteSingleFile()] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
