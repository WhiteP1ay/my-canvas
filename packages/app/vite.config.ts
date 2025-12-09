import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@canvas/math': path.resolve(__dirname, '../math/src'),
      '@canvas/elements': path.resolve(__dirname, '../elements/src'),
      '@canvas/core': path.resolve(__dirname, '../core/src'),
      '@canvas/canvas': path.resolve(__dirname, '../canvas/src'),
    },
  },
  root: '.',
  publicDir: '../../../public',
})

