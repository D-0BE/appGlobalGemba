import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expone en red local (0.0.0.0) — necesario para Docker
    proxy: {
      '/api': {
        // En Docker: API_TARGET=http://api:3001
        // En local:  http://localhost:3001
        target: process.env.API_TARGET || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
