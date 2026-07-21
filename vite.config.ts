import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // absolute base so assets resolve on nested routes (e.g. /work) with
  // BrowserRouter; the site is served from the domain root on Vercel
  base: '/',
  // repo-root assets/ doubles as the static dir so README.md can reference
  // assets/banner.png with the same files
  publicDir: 'assets',
  build: {
    target: 'es2020',
  },
})
