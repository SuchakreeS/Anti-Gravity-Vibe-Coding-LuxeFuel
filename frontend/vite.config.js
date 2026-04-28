import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      // Directs any request starting with /api to your local backend
      '/api': {
        target: 'http://localhost:5000', // Change this to your backend port
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
