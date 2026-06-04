import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
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
    // 定义环境变量
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
      'import.meta.env.VITE_ENV': JSON.stringify(env.VITE_ENV || mode),
      'import.meta.env.VITE_ENABLE_MOCK_DATA': JSON.stringify(env.VITE_ENABLE_MOCK_DATA || 'false'),
    },
  };
});