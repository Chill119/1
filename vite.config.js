import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': process.env
  },
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      'stellar-sdk': 'stellar-sdk/lib/index.js'
    }
  },
  optimizeDeps: {
    include: ['@stellar/freighter-api', 'stellar-sdk']
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
});