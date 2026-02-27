import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to Django backend
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      // Proxy Django admin panel
      '/admin': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      // Proxy static files (needed for Django admin CSS/JS)
      '/static': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      // Proxy WebSocket connections
      '/ws': {
        target: 'ws://localhost:8001',
        ws: true,
      },
    },
  },
})
