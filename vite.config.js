import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import tailwindcss      from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  worker: {
    format: 'es',
  },
  // Expose le dossier public/wasm sans transformation
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['luxlab-engine'],
  },
})