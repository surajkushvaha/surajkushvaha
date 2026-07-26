import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Run the Vercel edge function under `vite dev`.
 *
 * In production `api/ask.ts` is deployed by Vercel and served at /api/ask. The
 * Vite dev server knows nothing about that, so locally every request to it fell
 * through to index.html and "Ask Cuty" was dead unless you remembered to run
 * `vercel dev`. This adapts the handler's Web Request/Response signature onto
 * Node's req/res so the same file serves both, and the feature can actually be
 * tested while building it.
 *
 * Dev only: `apply: 'serve'` keeps it out of the production build entirely.
 */
function apiDevServer(env: Record<string, string>): Plugin {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/ask', async (req, res) => {
        try {
          // the handler reads the key off process.env; .env is not loaded into
          // the dev process by default, so bridge it here
          if (env.OLLAMA_API_KEY) process.env.OLLAMA_API_KEY = env.OLLAMA_API_KEY

          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const body = Buffer.concat(chunks).toString('utf8')

          const { default: handler } = await server.ssrLoadModule('/api/ask.ts')
          const response: Response = await handler(
            new Request(`http://localhost${req.url ?? '/'}`, {
              method: req.method,
              headers: { 'Content-Type': 'application/json' },
              body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
            }),
          )

          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(await response.text())
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: (err as Error).message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), apiDevServer(loadEnv(mode, process.cwd(), ''))],
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
}))
