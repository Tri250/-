import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  base: './',
  build: {
    sourcemap: 'hidden',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'state-vendor': ['zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  server: {
    watch: {
      ignored: ['**/android-sdk/**', '**/node_modules/**', '**/coverage/**'],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react'],
    exclude: ['@capacitor/android'],
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
  ],
});