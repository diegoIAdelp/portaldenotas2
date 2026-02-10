
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4444,
    host: true, // Isso permite que outros computadores na sua rede acessem pelo seu IP
    strictPort: true
  },
  preview: {
    port: 4444,
    host: true
  }
});
