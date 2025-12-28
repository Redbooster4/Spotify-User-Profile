import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/profile': 'http://127.0.0.1:8888',
      '/top-artists': 'http://127.0.0.1:8888',
      '/roast': 'http://127.0.0.1:8888',
      '/logout': 'http://127.0.0.1:8888',
      '/login': 'http://127.0.0.1:8888',
    }
  }
})
