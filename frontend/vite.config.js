import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = process.env.PORT || 5001;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': `http://localhost:${backendPort}`,
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
});
