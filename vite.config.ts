/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/learn-touch-typing/
  base: '/learn-touch-typing/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
