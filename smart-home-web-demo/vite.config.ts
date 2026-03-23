import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Run web demo on different port to avoid conflict with mobile
  server: {
    port: 5174,
    strictPort: true
  }
})
