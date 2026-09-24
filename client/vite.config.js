import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy Socket.IO WebSocket traffic to the backend
      '/socket.io': {
        target:      'http://localhost:3001',
        ws:          true,
        changeOrigin: true,
      },
      // Proxy REST API calls
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
