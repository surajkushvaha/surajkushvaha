export interface Project {
  name: string
  tag: string
  description: string
  chips: string[]
  /** Live/deployed URL — the row leads with this when present. */
  demo?: string
  link?: string
  linkLabel?: string
  status?: 'Private' | 'Research' | 'Internal' | 'Concept'
}

export const projects: Project[] = [
  {
    name: 'ProjectArch',
    tag: 'AI · PropTech',
    description:
      'An AI-powered architectural design platform for the Indian market: draw land on a map (Leaflet/Mapbox + OSM Overpass API for neighborhood analysis), run it through a custom DCR/zoning rule engine, then generate 2D floor plans (SVG/JSON) and extrude them into 3D with Three.js.',
    chips: ['Angular', 'Leaflet'],
    status: 'Private',
  },
  {
    name: 'Jessica',
    tag: 'AI · 3D',
    description:
      'An autonomous AI VTuber with a real-time 3D VRM avatar driven by the Gemini API, using a mood/expression/gesture/energy state machine. Reads live YouTube chat and donations and reacts on-stream; rebuilt a second iteration in Angular with a dedicated audio service.',
    chips: ['Three.js', 'Gemini'],
    link: 'https://github.com/thanksforfree/jessica',
    linkLabel: 'Code',
  },
  {
    name: 'RepoLens',
    tag: 'AI · Dev Tools',
    description:
      'Explore any GitHub codebase as a living, interactive map instead of a static folder tree. Paste a repo, fly through its architecture, and ask questions in plain language to understand a project in minutes, not days. Built with Next.js and the Vercel AI SDK (Claude).',
    chips: ['Next.js', 'AI SDK'],
    demo: 'https://repo-lens-one.vercel.app',
    link: 'https://github.com/surajkushvaha/RepoLens',
    linkLabel: 'Code',
  },
  {
    name: 'Neural Coppelia',
    tag: 'AI · R&D',
    description:
      'Earlier R&D that led into Jessica: analyzed bone data from 2,000+ Mixamo motion-capture clips to auto-generate semantic animation descriptions, then built vector-DB search to retrieve and LLM-blend body, hand, and facial animation layers in real time, scoped to run fully local on a 6GB VRAM GPU.',
    chips: ['Vector DB', 'Ollama'],
    status: 'Research',
  },
  {
    name: 'MotionCaptureXPro',
    tag: '3D · Tooling',
    description:
      'A modular Three.js animation engine split into independent managers (Animation, Camera, Light, and Model loading), built as reusable infrastructure for directing 3D character scenes, and the groundwork that later fed into both Neural Coppelia and Jessica.',
    chips: ['Three.js', 'Modular'],
    status: 'Internal',
  },
  {
    name: 'Dharmshankara',
    tag: 'Game Dev',
    description:
      '"A Mistake in Your Browser": a published 2D parody rage-game with combo combat and a karma system, built with an AI-assisted pipeline and packaged with Tauri for Web, Windows, and Android.',
    chips: ['Tauri', 'Rust'],
    link: 'https://theworstgamecompany.itch.io/dharmshankara',
    linkLabel: 'Play',
  },
  {
    name: 'projectK',
    tag: 'Full-Stack',
    description:
      'A document management & viewer platform integrating Apryse/PDFTron WebViewer for viewing and annotation, with file uploads, a media player, and role-based access control on the backend.',
    chips: ['NestJS', 'Angular'],
    link: 'https://github.com/surajkushvaha/projectK',
    linkLabel: 'Code',
  },
  {
    name: 'AI Dev Tooling',
    tag: 'Tooling',
    description:
      "Built my own AI-assisted engineering tools: a SKILL.md-based PR reviewer for VS Code Copilot with structured Angular and Java review checklists wired into GitKraken's MCP tools, plus agent instructions and prompt fixes for automated Angular test generation.",
    chips: ['Copilot', 'MCP'],
    status: 'Internal',
  },
  {
    name: 'Multi-modal LLM',
    tag: 'AI · ML',
    description:
      'Trained a small-scale multi-modal language model from a GPT-2 backbone, extending it to take text and image inputs together, a from-scratch exploration of how vision-language fusion actually works rather than just calling an existing multi-modal API.',
    chips: ['PyTorch', 'GPT-2'],
    status: 'Research',
  },
  {
    name: 'ecommerce-backend',
    tag: 'Backend',
    description:
      'A modular REST API for e-commerce (auth, cart, catalog, orders, payments, and a dashboard), built with NestJS and Prisma ORM, with JWT/Passport authentication and e2e test coverage.',
    chips: ['NestJS', 'Prisma'],
    link: 'https://github.com/surajkushvaha/ecommerce-backend',
    linkLabel: 'Code',
  },
  {
    name: 'OCR Microservice',
    tag: 'AI · Backend',
    description:
      'A FastAPI microservice using PaddleOCR for document text extraction and table detection, with Celery and Redis handling async task processing, the production counterpart to my custom OCR model-training experiments.',
    chips: ['FastAPI', 'PaddleOCR'],
    link: 'https://github.com/surajkushvaha/ocr_microservice',
    linkLabel: 'Code',
  },
  {
    name: 'Research Paper Explainer',
    tag: 'AI · Content',
    description:
      'An AI agent with a storytelling-oriented system prompt that turns dense research papers into narrative video scripts. Used it to turn Turing\'s 1936 "On Computable Numbers" into a full YouTube script plus a set of short-form reel scripts.',
    chips: ['Prompt Engineering', 'LLM'],
    status: 'Concept',
  },
  {
    name: 'colored-beautiful-logger',
    tag: 'Open Source',
    description:
      'A published TypeScript logging library with configurable log levels, file rotation, and custom ANSI/RGB colored output, maintained with a docs site.',
    chips: ['TypeScript', 'npm'],
    link: 'https://github.com/surajkushvaha/colored-beautiful-logger',
    linkLabel: 'Code',
  },
]

export const skillGroups: { label: string; chips: string[] }[] = [
  {
    label: 'Languages & Frameworks',
    chips: ['TypeScript', 'Angular', 'NestJS', 'Node.js', 'Rust', 'Python', 'Tauri'],
  },
  {
    label: 'AI & 3D',
    chips: ['Gemini API', 'Three.js', 'VRM avatars', 'Unity'],
  },
  {
    label: 'Backend & Infra',
    chips: ['Kafka', 'Elasticsearch', 'SSO/SAML', 'Docker', 'Kubernetes', 'Prisma'],
  },
  {
    label: 'Specialized',
    chips: ['WCAG / a11y', 'PDFTron WebViewer', 'OCR'],
  },
  {
    label: 'Research & Tooling',
    chips: ['PyTorch', 'Detectron2', 'Vector Search', 'Ollama / Local LLMs', 'MCP'],
  },
]

export interface ExpItem {
  role: string
  dates: string
  bullets?: string[]
  note?: string
}

export const experience: ExpItem[] = [
  {
    role: 'Software Engineer',
    dates: 'Jul 2025 - Present',
    bullets: [
      'Building Rust-based backend microservices for auth, payments, Kafka event streaming, and Elasticsearch search, plus SSO/SAML integration.',
      'Led the Angular 19 migration to standalone components with signals and OnPush, including tracking down a production loader-stuck bug caused by a non-standalone child component inside an OnPush parent.',
      'Improved frontend performance with trackBy on @for loops, RxJS debouncing, and XHR cancellation.',
    ],
  },
  {
    role: 'Associate Software Engineer',
    dates: 'Jul 2024 - Aug 2025',
    bullets: [
      'Designed a platform-wide accessibility service to manage WCAG-compliant features across the product.',
      'Integrated accessibility improvements into a legacy system without breaking existing flows, replacing JS-heavy patches with semantic HTML.',
    ],
  },
  {
    role: 'Trainee Software Engineer',
    dates: 'Jun 2023 - Aug 2024',
    bullets: [
      'Integrated Apryse (PDFTron) WebViewer for PDF rendering, manipulation, and viewer customization.',
      'Built OCR text extraction with Tesseract.js and email/Word-to-PDF conversion workflows across the Node.js backend and UI layers.',
    ],
  },
  {
    role: 'UI Intern',
    dates: 'Feb 2023 - May 2023',
    note: 'Built and enhanced Angular UI components in an agile workflow, working with Bitbucket and JIRA.',
  },
]

export const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M7 17L17 7M7 7h10v10" />
  </svg>
)

export interface Blog {
  title: string
  /** ISO date, e.g. '2026-03-14' */
  date: string
  summary: string
  url: string
  /** where it lives: 'Hashnode', 'Medium', 'Dev.to', etc. */
  source?: string
}
