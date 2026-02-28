import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist/h5',
    target: 'es2020',
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
