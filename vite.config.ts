
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4444,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4444',
        changeOrigin: true,
        secure: false
      },
      '/PDF': {
        target: 'http://localhost:4444',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4444,
    host: true
  }
});