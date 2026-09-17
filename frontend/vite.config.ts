import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  // SPA-роутинг: любой неизвестный путь отдаёт index.html,
  // иначе прямой заход на /dashboard даст 404 (актуально и для preview)
  preview: {
    port: Number(process.env.PORT),
  },
})
