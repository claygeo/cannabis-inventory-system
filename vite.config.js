import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // Development server config
  server: {
    port: 3000,
    open: true,
    host: true // Allow external connections (useful for testing)
  },
  
  // Build configuration optimized for Netlify
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for smaller bundle
    minify: 'esbuild', // Fast minification
    target: 'es2015', // Support older browsers
    
    // Optimize chunking for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components chunk
          ui: ['lucide-react', 'react-hot-toast'],
          // Utilities chunk
          utils: ['papaparse', 'jspdf', 'html2canvas', 'date-fns']
        },
        // Clean asset naming
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    },
    
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Optimize assets
    assetsInlineLimit: 4096, // Inline small assets as base64
  },
  
  // Ensure proper asset handling
  publicDir: 'public',
  
  // Define environment variables if needed
  define: {
    // You can add global constants here if needed
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '5.3.0'),
  },
  
  // Preview configuration (for local testing of build)
  preview: {
    port: 4173,
    host: true
  }
})