import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    // Add this allowedHosts array here:
    allowedHosts: [
      'unthoughtful-alease-actinomorphic.ngrok-free.dev', // Your ngrok URL
      'localhost', // Keep localhost explicitly if needed
      '127.0.0.1', // Keep 127.0.0.1 explicitly if needed
    ],
  }
})