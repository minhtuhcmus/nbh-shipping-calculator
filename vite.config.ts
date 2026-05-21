import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/ghn': {
        target: 'https://dev-online-gateway.ghn.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ghn/, ''),
      },
      '/api/ghtk': {
        target: 'https://services.giaohangtietkiem.vn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ghtk/, ''),
      },
      '/api/ahamove': {
        target: 'https://apistg.ahamove.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ahamove/, ''),
      },
      '/api/lalamove': {
        target: 'https://rest.sandbox.lalamove.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lalamove/, ''),
      },
    },
  },
})
