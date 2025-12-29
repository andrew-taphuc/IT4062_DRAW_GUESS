import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true
    }
  },
  build: {
    // Optimize cho VPS
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách React vendor ra chunk riêng
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    // Sử dụng esbuild minify (nhanh hơn terser, ít tốn memory hơn)
    minify: 'esbuild'
  }
})
