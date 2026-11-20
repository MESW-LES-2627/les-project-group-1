import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Forward /api/* to the backend during development.
    // The browser only talks to the Vite server, so there are no CORS problems.
    proxy: {
      "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
})
