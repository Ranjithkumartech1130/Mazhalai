import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',   // Relative paths so admin-app/ works as a subfolder of the public site
  build: {
    outDir: '../public/admin-app',
    emptyOutDir: true,
  },
})

