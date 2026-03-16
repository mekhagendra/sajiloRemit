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
          // CKEditor is NOT listed here — it flows into the AdminBlogs
          // dynamic chunk and is only downloaded when that route is visited.
        },
      },
    },
    // CKEditor is ~1.3 MB pre-built and cannot be split further.
    // It lives in a lazy async chunk so it never blocks the initial load.
    chunkSizeWarningLimit: 1400,
  },
})
