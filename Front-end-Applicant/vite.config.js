import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    // REMOVE tailwindcss plugin since we're not using Tailwind anymore
  ],
  server: {
    port: 3000,
    open: true
  }
})