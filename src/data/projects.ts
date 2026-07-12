export interface Project {
  name: string
  tag: string
  description: string
  link: string | null
  linkLabel: string
}

export const projects: Project[] = [
  {
    name: 'ProjectArch',
    tag: 'AI · GIS · 3D',
    description:
      'AI-assisted architectural design platform for the Indian market — map-based land drawing, zoning & DCR compliance, AI-generated 2D layouts, 3D rendering.',
    link: null,
    linkLabel: 'private — in development',
  },
  {
    name: 'Jessica',
    tag: 'AI VTuber',
    description:
      'Autonomous AI VTuber — real-time VRM avatar, Gemini-driven persona, live YouTube chat and donation reactions.',
    link: 'https://github.com/thanksforfree/jessica',
    linkLabel: 'github.com/thanksforfree/jessica',
  },
  {
    name: 'projectK',
    tag: 'Documents',
    description:
      'Document management & viewer platform — Angular + NestJS + PDFTron WebViewer with role-based access control.',
    link: 'https://github.com/surajkushvaha/projectK',
    linkLabel: 'github.com/surajkushvaha/projectK',
  },
  {
    name: 'ecommerce-backend',
    tag: 'NestJS API',
    description:
      'Modular NestJS e-commerce API — auth, cart, orders, payments, Prisma ORM.',
    link: 'https://github.com/surajkushvaha/ecommerce-backend',
    linkLabel: 'github.com/surajkushvaha/ecommerce-backend',
  },
  {
    name: 'ocr_microservice',
    tag: 'OCR · Python',
    description:
      'FastAPI + PaddleOCR document intelligence service with async Celery/Redis processing.',
    link: 'https://github.com/surajkushvaha/ocr_microservice',
    linkLabel: 'github.com/surajkushvaha/ocr_microservice',
  },
  {
    name: 'colored-beautiful-logger',
    tag: 'npm library',
    description:
      'Published TypeScript logging library — log levels, file rotation, custom colored output.',
    link: 'https://github.com/surajkushvaha/colored-beautiful-logger',
    linkLabel: 'github.com/surajkushvaha/colored-beautiful-logger',
  },
  {
    name: 'Dharmshankara',
    tag: 'Game',
    description:
      'Published 2D parody rage-game, Tauri-packaged for Web, Windows and Android.',
    link: 'https://theworstgamecompany.itch.io/dharmshankara',
    linkLabel: 'theworstgamecompany.itch.io',
  },
]

export const stackGroups: { title: string; items: string[] }[] = [
  {
    title: 'Frontend',
    items: ['TypeScript', 'Angular 17–19', 'Three.js', 'HTML / CSS / SCSS'],
  },
  {
    title: 'Backend',
    items: ['Node.js', 'NestJS', 'Rust', 'Python'],
  },
  {
    title: 'Data & Infra',
    items: [
      'PostgreSQL',
      'Prisma',
      'Docker',
      'Kafka',
      'Elasticsearch',
      'Redis',
      'Supabase',
    ],
  },
  {
    title: 'Specialties',
    items: [
      'Accessibility (WCAG 2.2)',
      'PDF / OCR pipelines',
      '3D web (VRM · GLTF · FBX)',
      'Tauri desktop',
    ],
  },
]
