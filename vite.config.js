import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Use esbuild instead of terser (faster and built-in)
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          utils: ['papaparse', 'jsbarcode', 'jspdf', 'xlsx']
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // esbuild minify options
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
  
  // CSS configuration - References .cjs file
  css: {
    postcss: './postcss.config.cjs',
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
      'date-fns',
      'xlsx'
    ]
  },
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '5.3.1')
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  
  // Base path for deployment
  base: '/',
  
  // Environment variables prefix
  envPrefix: 'VITE_',
})