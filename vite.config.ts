import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // 相对路径基址：产物可部署于任意子路径 (file:// / 子目录)，资源引用为 ./assets/*
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // import.meta.dirname 需 Node ≥20.11 (本地 v24 / CI node 20 均满足)
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
