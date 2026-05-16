import { defineConfig } from 'vite'
import react            from '@vitejs/plugin-react'
import tailwindcss      from '@tailwindcss/vite'

export default defineConfig({
  plugins: [ react(), tailwindcss() ],
  worker:  { format: 'es' },
  server:  {
    headers: {
      'Cross-Origin-Opener-Policy':  'same-origin',
      'Cross-Origin-Embedder-Policy':'require-corp',
    },
  },
})