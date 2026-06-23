import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@capacitor/camera': path.resolve(__dirname, './src/test-utils/capacitorMocks.ts'),
      '@capacitor/local-notifications': path.resolve(__dirname, './src/test-utils/capacitorMocks.ts'),
      '@capacitor/geolocation': path.resolve(__dirname, './src/test-utils/capacitorMocks.ts'),
      '@capacitor/preferences': path.resolve(__dirname, './src/test-utils/capacitorMocks.ts'),
      '@capacitor/app': path.resolve(__dirname, './src/test-utils/capacitorMocks.ts'),
      '@capacitor/device': path.resolve(__dirname, './src/test-utils/capacitorMocks.ts'),
      '@capacitor/biometrics': path.resolve(__dirname, './src/test-utils/capacitorMocks.ts'),
      '@capacitor/haptics': path.resolve(__dirname, './src/test-utils/capacitorMocks.ts'),
    }
  },
  optimizeDeps: {
    exclude: [
      '@capacitor/camera',
      '@capacitor/local-notifications',
      '@capacitor/geolocation',
      '@capacitor/preferences',
      '@capacitor/app',
      '@capacitor/device',
      '@capacitor/biometrics',
      '@capacitor/haptics',
    ]
  }
});
