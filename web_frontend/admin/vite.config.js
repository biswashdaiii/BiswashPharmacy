import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../../ssl/private-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../../ssl/certificate.pem')),
    },
    host: true,
    port: 5174
  }
})
