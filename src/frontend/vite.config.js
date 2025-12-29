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
    // Tăng memory limit và optimize cho VPS
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách react-icons ra chunk riêng để tránh treo khi build
          'react-icons': ['react-icons/io5', 'react-icons/fa', 'react-icons/md'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    },
    // Sử dụng esbuild minify (nhanh hơn terser, ít tốn memory hơn)
    minify: 'esbuild'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react-icons/io5', 'react-icons/fa', 'react-icons/md']
  }
})
