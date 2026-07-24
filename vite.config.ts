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
  // @pixiv/three-vrm resolves its own copy of three, which means two separate
  // class registries: every `instanceof THREE.Mesh` against a VRM-loaded object
  // silently returns false. Deduping is not an optimisation here, it is what
  // makes the loaded avatar usable at all.
  resolve: {
    dedupe: ['three'],
  },
  server: {
    watch: {
      // `art/` holds raw generated source (multi-hundred-MB FBX plus texture
      // sets) that is processed into assets/ by scripts/prop.py. Watching it
      // is pointless and actively harmful: a file still being written by a
      // download throws EBUSY on Windows and takes the whole dev server down.
      ignored: ['**/art/**'],
    },
  },
  build: {
    target: 'es2020',
  },
})
