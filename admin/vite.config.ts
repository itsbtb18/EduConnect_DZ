import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy target: inside Docker → http://api:8000, locally → http://localhost:8001
const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:8001'
const WS_TARGET = API_TARGET.replace(/^http/, 'ws')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Proxy API calls to Django backend
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
      // Proxy Django admin panel
      '/admin': {
        target: API_TARGET,
        changeOrigin: true,
      },
      // Proxy static files (needed for Django admin CSS/JS)
      '/static': {
        target: API_TARGET,
        changeOrigin: true,
      },
      // Proxy media files (user uploads — logos, attachments, etc.)
      '/media': {
        target: API_TARGET,
        changeOrigin: true,
      },
      // Proxy WebSocket connections
      '/ws': {
        target: WS_TARGET,
        ws: true,
      },
    },
  },
})
