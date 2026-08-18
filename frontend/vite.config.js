import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Enables React support in Vite
  plugins: [react()],
  
  // Development server configuration
  server: {
    port: 5173, // Standard Vite port
    strictPort: true, // Will fail if port 5173 is already in use, preventing confusion
    
    // Proxy configuration to connect smoothly with your Python FastAPI backend
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Your FastAPI default port
        changeOrigin: true,
        secure: false,
      }
    }
  }
})