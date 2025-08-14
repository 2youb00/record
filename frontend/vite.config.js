import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 👇 هذا مهم جدًا
export default defineConfig({
  base: './',
  plugins: [react()],
})
