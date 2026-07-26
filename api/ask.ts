/**
 * Ask Cuty.
 *
 * A Vercel serverless function so OLLAMA_API_KEY stays on the server. Calling
 * Ollama straight from the browser would ship the key to every visitor, and a
 * key in client JS is a key that is already leaked.
 *
 * Cuty's scripted lines are NOT generated. Zone greetings and the fourth-wall
 * beats are written, because a written line is instant, free, and funnier than
 * a generated one. The model is here for the thing that cannot be scripted:
 * a recruiter asking something specific and getting a real answer grounded in
 * the CV below.
 */

// Kept in this file rather than imported from src/, because the serverless
// bundle should not pull the React app in just to read a few facts.
const CV = `
Suraj Kushvaha - Software Engineer, Ahmedabad, India.
Contact: suraj04patel@gmail.com, linkedin.com/in/surajkushvaha, github.com/surajkushvaha
B.Tech Computer Engineering.

EMPLOYMENT (all at Asite Solution Pvt Ltd, Feb 2023 to present):
- Software Engineer (Jul 2025 to present): Rust backend microservices for auth
  and payments, Kafka event streaming, Elasticsearch search, SSO/SAML.
- Associate Software Engineer (Jul 2024 to Jun 2025): built a platform-wide
  accessibility service for WCAG compliance; led the Angular 19 migration to
  standalone components with signals and OnPush; fixed a production loader-stuck
  bug caused by a non-standalone child inside an OnPush parent; improved
  performance with trackBy, @for loops, RxJS debouncing, XHR cancellation.
- Trainee Software Engineer (Jun 2023 to Jun 2024): integrated Apryse (PDFTron)
  WebViewer for PDF rendering, manipulation and viewer customisation; built
  OCR text extraction with Tesseract.js and email/Word-to-PDF conversion across
  the Node.js backend and UI layers.
- UI Intern (Feb 2023 to May 2023): Angular UI components, agile, Bitbucket, JIRA.

PROJECTS:
- ProjectArch: AI architecture-design platform for the Indian market. Draw land
  on a map (Leaflet/Mapbox + OpenStreetMap Overpass API for neighbourhood
  analysis), run a custom DCR/zoning rule engine, generate 2D floor plans
  (SVG/JSON) and extrude them into 3D with Three.js. Private.
- Jessica: autonomous AI VTuber with a real-time 3D VRM avatar, driven by the
  Gemini API, with a mood/expression/gesture/energy state machine. Reads live
  YouTube chat and donations and reacts on stream. Rebuilt in Angular with a
  dedicated audio service.
- Neural Coppelia: R&D that led into Jessica. Analysed bone data from 2,000+
  Mixamo motion-capture clips to auto-generate semantic animation descriptions,
  then built vector-DB search to retrieve and LLM-blend body, hand and facial
  animation layers in real time. Scoped to run fully local on an 8GB VRAM GPU.
- RepoLens: explore any GitHub codebase as a living, interactive map instead of
  a static folder tree. Built with Next.js and the Vercel AI SDK (Claude). Live.
- Also: a published 2D game, custom OCR model training (Detectron2, Mask R-CNN,
  PyTorch ViTs), review and test-generation tooling for AI coding assistants,
  and an AI agent that turns research papers into narrated video scripts.

SKILLS: TypeScript, Angular, NestJS, Node.js, Rust, Python, Tauri, Three.js,
Gemini API, VRM avatars, Unity, Kafka, Elasticsearch, SSO/SAML, Docker,
Kubernetes, Prisma, WCAG accessibility, PDFTron WebViewer, OCR, PyTorch,
Detectron2, vector search, Ollama and local LLMs, MCP.
`.trim()

const SYSTEM = `You are Cuty, the robot companion in Suraj Kushvaha's portfolio world.

You answer questions about Suraj using ONLY the facts below. If something is not
in there, say you do not know and point them at his email. Never invent an
employer, a date, a metric or a technology.

Voice: dry, specific, a little deadpan. You are fond of him but you are not his
publicist. Two or three sentences at most, plain prose, no bullet points, no
markdown, no exclamation marks. Prefer a concrete detail over an adjective.

Never claim to be Suraj. You are the robot that works for him.

FACTS:
${CV}`

type Msg = { role: 'user' | 'assistant'; content: string }

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Use POST.' }, 405)
  }

  const key = process.env.OLLAMA_API_KEY
  if (!key) {
    return json({ error: 'The assistant is not configured right now.' }, 503)
  }

  let question: string
  let history: Msg[] = []
  try {
    const body = (await req.json()) as { question?: unknown; history?: unknown }
    if (typeof body.question !== 'string') throw new Error('bad question')
    question = body.question.trim()
    if (Array.isArray(body.history)) {
      // only keep the last few turns, and only the shape we expect
      history = body.history
        .slice(-6)
        .filter(
          (m): m is Msg =>
            !!m &&
            typeof (m as Msg).content === 'string' &&
            ((m as Msg).role === 'user' || (m as Msg).role === 'assistant'),
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }))
    }
  } catch {
    return json({ error: 'Malformed request.' }, 400)
  }

  if (!question) return json({ error: 'Ask something first.' }, 400)
  // a hard cap at the boundary: this is the one input a stranger controls
  if (question.length > 500) {
    return json({ error: 'That question is too long. Try a shorter one.' }, 400)
  }

  try {
    const upstream = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss:20b',
        stream: false,
        /**
         * gpt-oss is a reasoning model: it returns `thinking` alongside
         * `content`, and both are drawn from the same `num_predict` budget.
         * At the previous 220 the reasoning consumed the whole allowance and
         * `content` came back EMPTY - measured at 956 characters of thinking
         * and zero of answer - so the endpoint returned "Cuty had nothing to
         * say" for most questions.
         *
         * Capping the reasoning effort is the fix rather than simply raising
         * the budget: `think: 'low'` leaves room for an answer, and is also
         * faster (1.6s against 2.5s) and cheaper. `think: false` is ignored by
         * this model, so it is not an option.
         */
        think: 'low',
        options: { temperature: 0.45, num_predict: 320 },
        messages: [
          { role: 'system', content: SYSTEM },
          ...history,
          { role: 'user', content: question },
        ],
      }),
    })

    if (!upstream.ok) {
      // never forward the upstream body: it can carry account details
      console.error('ollama upstream', upstream.status)
      return json({ error: 'Cuty is offline. His email still works.' }, 502)
    }

    const data = (await upstream.json()) as { message?: { content?: string } }
    const answer = data.message?.content?.trim()
    if (!answer) return json({ error: 'Cuty had nothing to say. Try rephrasing.' }, 502)

    return json({ answer })
  } catch (err) {
    console.error('ollama call failed', err)
    return json({ error: 'Cuty is offline. His email still works.' }, 502)
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}
