import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // relative base so the build works on Vercel and under a GitHub Pages subpath
  base: './',
  // repo-root assets/ doubles as the static dir so README.md can reference
  // assets/banner.png with the same files
  publicDir: 'assets',
  build: {
    target: 'es2020',
  },
})
