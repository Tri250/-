import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  // 加载环境变量（支持 .env.development, .env.production, .env.android）
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'ANDROID_']);
  
  // 判断是否为 Android 构建
  const isAndroidBuild = mode === 'android' || process.env.CAPACITOR_BUILD === 'true';
  
  // Android 构建时使用特定的 API 地址
  const apiUrl = isAndroidBuild 
    ? (env.VITE_ANDROID_EMULATOR_URL || env.VITE_API_URL || 'http://10.0.2.2:3000/api')
    : (env.VITE_API_URL || '');
  
  return {
    base: './',
    build: {
      sourcemap: mode === 'development' ? true : 'hidden',
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['lucide-react', 'framer-motion'],
            'state-vendor': ['zustand'],
            'capacitor-vendor': ['@capacitor/core', '@capacitor/android'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
      // Android 构建优化
      minify: mode === 'production' || isAndroidBuild ? 'terser' : false,
      target: 'es2015',
    },
    server: {
      watch: {
        ignored: ['**/android-sdk/**', '**/node_modules/**', '**/coverage/**'],
      },
      // 开发服务器配置
      host: true,
      port: 5173,
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
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_ENV': JSON.stringify(env.VITE_ENV || mode),
      'import.meta.env.VITE_ENABLE_MOCK_DATA': JSON.stringify(env.VITE_ENABLE_MOCK_DATA || 'false'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(env.VITE_DEBUG_MODE || 'false'),
      'import.meta.env.VITE_LOG_LEVEL': JSON.stringify(env.VITE_LOG_LEVEL || 'info'),
      'import.meta.env.VITE_ENABLE_NATIVE_FEATURES': JSON.stringify(env.VITE_ENABLE_NATIVE_FEATURES || 'true'),
      'import.meta.env.VITE_ANDROID_PACKAGE_NAME': JSON.stringify(env.VITE_ANDROID_PACKAGE_NAME || 'com.pawsync.pro'),
      'import.meta.env.VITE_ANDROID_VERSION_CODE': JSON.stringify(env.VITE_ANDROID_VERSION_CODE || '1'),
      'import.meta.env.VITE_ANDROID_VERSION_NAME': JSON.stringify(env.VITE_ANDROID_VERSION_NAME || '1.0.0'),
      // 平台标识
      'import.meta.env.VITE_PLATFORM': JSON.stringify(isAndroidBuild ? 'android' : 'web'),
    },
  };
});