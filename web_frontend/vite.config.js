import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../ssl/private-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../ssl/certificate.pem')),
    },
    host: true,
    port: 5173,
    hmr: {
      host: '192.168.159.1',
      port: 5173,
      protocol: 'wss'
    },
    proxy: {
      '/api': {
        target: 'https://192.168.159.1:5050',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
