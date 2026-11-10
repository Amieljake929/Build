import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // expose on your local network so phones on the same Wi-Fi can open it
    port: 5173,
  },
  preview: {
    host: true, // same for `npm run preview`
    port: 4173,
  },
})