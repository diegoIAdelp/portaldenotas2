// vite.config.js
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    // ⚠️ Fundamental para GitHub Pages
    base: mode === 'production' ? '/portaldenotas2/' : '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    // Observação: tudo que entra aqui vai para o bundle do cliente.
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY ?? ''),
    },

    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },

    build: {
      // Opcional: só para silenciar o warning de chunk grande
      chunkSizeWarningLimit: 1500,
    },
  };
});
