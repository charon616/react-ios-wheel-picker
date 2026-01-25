import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Demo build for GitHub Pages
export default defineConfig({
  root: 'example',
  base: '/react-ios-wheel-picker/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      allow: [resolve(__dirname, '.')],
    },
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
})
