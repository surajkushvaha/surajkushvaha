/**
 * The world's geography.
 *
 * Layout is orthogonal and it means something: the timeline runs north as one
 * road because chronology has a direction, the gallery is a wide field east
 * because those projects are parallel to each other, and the tower sits at the
 * far end because contact is the exit.
 *
 * Everything here is data. The renderer reads it; nothing here imports three.
 */

export type Zone = {
  id: string
  name: string
  /** centre on the ground plane, [x, z] */
  at: [number, number]
  /** half-extent of the square plate; also the trigger radius */
  r: number
  /**
   * The zone's light.
   *
   * Each zone is marked in a different colour so the world is navigable by
   * eye: you can pick out the workshop from across the plain by the line
   * painted around it.
   *
   * These are deliberately muted. They began as neon, which worked when the
   * world was dark and lit by them; on white card in daylight the same values
   * read as fluorescent tape. Now they behave like paint on an architect's
   * model, which is what they are.
   */
  light: string
  /** what Cuty says on arrival */
  say: string
  panel: {
    heading: string
    meta: string
    body?: string[]
    list?: string[]
  }
}

/**
 * Coordinates are compact on purpose: the world is a single small floating
 * island, not an open plain, so the five zones sit close enough that the whole
 * place reads at a glance. The island is centred near [0, -6] with radius ~32;
 * every zone here lands inside it. See Terrain.tsx for the island itself.
 */
export const ZONES: Zone[] = [
  {
    id: 'grid',
    light: '#6d84c4',
    name: 'The Clearing',
    at: [0, 12],
    r: 11,
    say: "You're here. Good. I'm Cuty, I keep the lights on while he's at work.",
    panel: {
      heading: 'Suraj Kushvaha',
      meta: 'Software Engineer · Ahmedabad',
      body: [
        'Angular frontend architecture and Rust/Node backend microservices at Asite by day. AI avatars, OCR pipelines and motion-capture research the rest of the time.',
        'Walk north for the timeline, or use the buttons to skip ahead.',
      ],
    },
  },
  {
    id: 'timeline',
    light: '#e08a4c',
    name: 'Experience Ridge',
    at: [0, -8],
    r: 10,
    say: 'Three years, one company, four job titles. He kept getting handed the thing nobody else wanted to own.',
    panel: {
      heading: 'Asite',
      meta: 'Feb 2023 to present · four roles',
      list: [
        'Software Engineer (Jul 2025-) - Rust microservices for auth and payments, Kafka event streaming, Elasticsearch.',
        'Associate SE (Jul 2024-25) - platform-wide WCAG accessibility service, led the Angular 19 standalone migration.',
        'Trainee SE (Jun 2023-24) - Apryse PDFTron WebViewer, Tesseract OCR to searchable PDF.',
        'UI Intern (Feb-May 2023) - Angular component work in an agile team.',
      ],
    },
  },
  {
    id: 'workshop',
    light: '#d1655a',
    name: 'The Workshop',
    at: [-22, -6],
    r: 10,
    say: "Not a skill tree. He'd find that embarrassing. These are the tools that are actually worn down.",
    panel: {
      heading: 'What he reaches for',
      meta: 'Worn, not listed',
      list: [
        'Ships daily: TypeScript, Angular, NestJS, Node.js, Rust.',
        'Reaches for often: Three.js, Python, PyTorch, Docker, Kafka.',
        'Specialist ground: WCAG accessibility, PDF and document tooling, OCR.',
        'Research shelf: Detectron2, vector search, local LLMs, MCP.',
      ],
    },
  },
  {
    id: 'gallery',
    light: '#8f7bc8',
    name: 'The Gallery',
    at: [22, -6],
    r: 10,
    say: 'The avatar on the left is Jessica. She talks back on stream, which was not originally the plan.',
    panel: {
      heading: 'Things he built',
      meta: '13 projects · 4 standing here',
      list: [
        'ProjectArch - AI architecture platform. Draws on a map, extrudes 2D floor plans into 3D. It built this level.',
        'Jessica - autonomous AI VTuber. VRM avatar, mood and gesture state machine, reads live chat.',
        'Neural Coppelia - 2,000+ mocap clips, semantic search, LLM-blended body and face layers, on one 8GB GPU.',
        'RepoLens - explore any GitHub repo as a living map instead of a folder tree.',
      ],
    },
  },
  {
    id: 'tower',
    light: '#3f9f90',
    name: 'The Signal Tower',
    at: [0, -26],
    r: 10,
    say: 'That is the way out. His email is on the beacon, and he does actually answer it.',
    panel: {
      heading: "Let's build something",
      meta: 'The exit is also the entrance',
      body: ['suraj04patel@gmail.com'],
      list: ['LinkedIn /in/surajkushvaha', 'GitHub /surajkushvaha'],
    },
  },
]

/** Which zone contains this point, or null for the dark between them. */
export function zoneAt(x: number, z: number): Zone | null {
  for (const zone of ZONES) {
    if (
      Math.abs(x - zone.at[0]) < zone.r &&
      Math.abs(z - zone.at[1]) < zone.r
    ) {
      return zone
    }
  }
  return null
}
