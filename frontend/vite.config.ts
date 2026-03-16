import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep stable vendor chunks for long-term caching
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('react-router')) return 'react';
          if (id.includes('lucide-react')) return 'lucide';
          if (id.includes('axios')) return 'axios';
          // @ckeditor is not listed here
          // dynamic chunk and is only downloaded when that route is visited.
        },
      },
    },
    // It lives in a lazy async chunk so it never blocks the initial load.
    chunkSizeWarningLimit: 1400,
  },
})
