import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          utils: ['papaparse', 'jsbarcode', 'jspdf']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external connections
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
  
  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hot-toast',
      'papaparse',
      'jsbarcode',
      'jspdf',
      'lucide-react',
      'date-fns'
    ]
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '5.3.0')
  },
  
  // Resolve aliases (optional)
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  
  // Base path for deployment
  base: '/',
  
  // Environment variables prefix (optional)
  envPrefix: 'VITE_',
}