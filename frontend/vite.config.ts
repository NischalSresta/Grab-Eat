import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      'sockjs-client',
      'js-cookie',
      '@stomp/stompjs',
      'axios',
      'react-hook-form',
      '@hookform/resolvers/zod',
    ],
  },
  server: {
    strictPort: false,
  },
})
