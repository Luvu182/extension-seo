import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' with { type: 'json' };
import path from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
    {
      name: 'copy-css-files',
      closeBundle() {
        // Ensure css directory exists
        try {
          mkdirSync('dist/css', { recursive: true });
          // Copy CSS files
          copyFileSync('css/styles.css', 'dist/css/styles.css');
          copyFileSync('css/animations.css', 'dist/css/animations.css');
        } catch (e) {
          console.error('Failed to copy CSS files:', e);
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'js': path.resolve(__dirname, './js'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      input: {
        popup: 'popup.html',
      },
    },
  },
});