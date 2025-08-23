import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['keytar', '@nut-tree/nut-js']
            }
          }
        }
      },
      {
        // Preload scripts
        entry: 'src/preload/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload'
          }
        },
        onstart(options) {
          options.reload();
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
