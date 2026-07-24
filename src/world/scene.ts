import { ZONES } from './zones'

/**
 * The island's contents as plain data, generated once.
 *
 * This lives apart from Terrain so two consumers can share the exact same
 * layout: Terrain renders it, and World collides the player against it. Both
 * read the same arrays, so a tree you see is a tree you bump into - there is no
 * second, drifting copy of the layout to keep in sync.
 *
 * Everything is deterministic (seeded), because a world that rearranges itself
 * between visits is one you cannot learn.
 */

export const ISLAND = { cx: 0, cz: -6, r: 33 }

/** native height of each asset (Blender bounds) -> target world height, so
 *  scale is derived not guessed. Robot is ~2.4 tall for reference. */
const NAT: Record<string, number> = {
  'pine-tall': 10.24,
  'pine-lush': 7.39,
  'pine-snow': 3.34,
  'tree-b': 5.57,
  'autumn-tree': 3.12,
  'tree-a': 2.48,
  bush: 1.24,
  'flower-bush': 1.69,
  mushrooms: 2.46,
  'rock-large': 3.29,
  'rock-s': 3.83,
  'rock-xs': 0.19,
}
/** native distance from origin down to base (Blender minZ); used to sit each
 *  asset exactly on the ground rather than half-buried. */
const BASE: Record<string, number> = {
  mushrooms: -1.38,
  'flower-bush': -0.45,
  'rock-s': -0.37,
  'rock-large': -0.32,
  'pine-tall': -0.24,
  'pine-lush': -0.24,
}
export const scaleFor = (k: string, targetH: number) => targetH / (NAT[k] ?? 1)
const groundY = (k: string, scale: number) => -(BASE[k] ?? 0) * scale

function makeRng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const dist = (x: number, z: number, cx: number, cz: number) => Math.hypot(x - cx, z - cz)

export type Placed = { k: string; x: number; z: number; h: number; rot: number; y: number }
export type Rim = { x: number; z: number; h: number; rot: number; y: number; big: boolean }
/** a solid circle on the ground the player cannot walk into */
export type Collider = { x: number; z: number; r: number }

function buildScatter(): Placed[] {
  const rnd = makeRng(20260724)
  const out: Placed[] = []

  const CANOPY: [string, number, number][] = [
    ['pine-tall', 8, 0],
    ['pine-lush', 6.4, 0],
    ['tree-b', 5.2, 0],
    ['autumn-tree', 4.2, 0],
    ['pine-snow', 4.2, 0],
    ['tree-a', 3.4, 0],
  ]
  const UNDER: [string, number, number][] = [
    ['bush', 1.4, 0],
    ['flower-bush', 1.4, 0],
    ['mushrooms', 1.6, 0],
    ['rock-s', 2.2, -0.1],
    ['rock-xs', 0.6, 0],
  ]

  const clearOfZones = (x: number, z: number, pad: number) =>
    ZONES.every((zn) => dist(x, z, zn.at[0], zn.at[1]) > zn.r * 0.62 + pad)

  const add = (k: string, x: number, z: number, targetH: number, sink: number) => {
    const s = scaleFor(k, targetH)
    out.push({ k, x, z, h: targetH, rot: rnd() * Math.PI * 2, y: groundY(k, s) + sink })
  }

  // canopy: fills the island but leaves each zone's centre walkable and open
  for (let i = 0; i < 52; i++) {
    const a = rnd() * Math.PI * 2
    const rr = ISLAND.r * (0.35 + 0.6 * Math.sqrt(rnd()))
    const x = ISLAND.cx + Math.cos(a) * rr
    const z = ISLAND.cz + Math.sin(a) * rr
    if (dist(x, z, ISLAND.cx, ISLAND.cz) > ISLAND.r - 2.5) continue
    if (!clearOfZones(x, z, 1.5)) continue
    if (dist(x, z, 0, 12) < 6) continue // keep spawn clear
    const [k, h, sink] = CANOPY[(rnd() * CANOPY.length) | 0]
    add(k, x, z, h * (0.82 + rnd() * 0.36), sink)
  }

  // undergrowth: denser, smaller, allowed closer to zones as dressing
  for (let i = 0; i < 90; i++) {
    const a = rnd() * Math.PI * 2
    const rr = ISLAND.r * Math.sqrt(rnd())
    const x = ISLAND.cx + Math.cos(a) * rr
    const z = ISLAND.cz + Math.sin(a) * rr
    if (dist(x, z, ISLAND.cx, ISLAND.cz) > ISLAND.r - 2) continue
    if (!clearOfZones(x, z, -1)) continue
    if (dist(x, z, 0, 12) < 4) continue
    const [k, h, sink] = UNDER[(rnd() * UNDER.length) | 0]
    add(k, x, z, h * (0.8 + rnd() * 0.5), sink)
  }

  return out
}

function buildRim(): Rim[] {
  const rnd = makeRng(77)
  const rocks: Rim[] = []
  const n = 26
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.18
    const rr = ISLAND.r - 0.5 - rnd() * 1.2
    rocks.push({
      x: ISLAND.cx + Math.cos(a) * rr,
      z: ISLAND.cz + Math.sin(a) * rr,
      h: 3.4 + rnd() * 3.2,
      rot: rnd() * Math.PI * 2,
      y: -0.6 - rnd() * 0.8,
      big: rnd() > 0.6,
    })
  }
  return rocks
}

/**
 * Deliberate per-zone landmarks, placed by hand rather than scattered, so each
 * zone has a silhouette you navigate by and a bit of meaning:
 *  - Experience: pines in an ascending row, the way the career steps up.
 *  - Workshop: a knot of worn rock, a stone bench of tools.
 *  - Gallery: two low rock plinths flanking where Jessica stands.
 *  - Signal Tower: one hero pine, the tallest thing on the island, with the
 *    beacon gem floating above it (see Terrain's Waypoint height).
 * The Clearing (spawn) is left open on purpose.
 */
function buildLandmarks(): Placed[] {
  const out: Placed[] = []
  const at = Object.fromEntries(ZONES.map((z) => [z.id, z.at])) as Record<string, [number, number]>
  const put = (k: string, x: number, z: number, h: number, rot = 0) =>
    out.push({ k, x, z, h, rot, y: groundY(k, scaleFor(k, h)) })

  const [tx, tz] = at.timeline
  ;[4.5, 6, 7.5, 9].forEach((h, i) => put('pine-tall', tx - 6 + i * 4, tz - 2, h, i * 0.4))

  const [wx, wz] = at.workshop
  put('rock-large', wx, wz - 1, 4.2, 0.4)
  put('rock-s', wx - 3, wz + 1, 2.6, 1.1)
  put('rock-s', wx + 3, wz + 1.5, 3.0, 2.2)

  const [gx, gz] = at.gallery
  put('rock-large', gx - 4.5, gz + 1, 2.2, 0.2)
  put('rock-large', gx + 4.5, gz + 1, 2.4, 1.6)

  const [sx, sz] = at.tower
  put('pine-tall', sx, sz, 12, 0)
  put('rock-s', sx - 3.5, sz - 2, 3.0, 0.5)
  put('rock-s', sx + 3.5, sz - 1, 2.6, 1.9)

  return out
}

export const SCATTER: Placed[] = [...buildScatter(), ...buildLandmarks()]
export const RIM: Rim[] = buildRim()

/**
 * Which of those are solid. Trees block at the trunk (you brush past the
 * branches, you don't pass through the wood) and rocks block at their footprint.
 * Grass, flowers, mushrooms and pebbles are not solid: catching on ankle-high
 * dressing would feel worse than walking through it.
 */
const SOLID = /^(pine|tree|autumn|rock-s|rock-large)/
export const COLLIDERS: Collider[] = [
  ...SCATTER.filter((p) => SOLID.test(p.k)).map((p) => ({
    x: p.x,
    z: p.z,
    // trunk radius for trees (a fraction of height), footprint for rocks
    r: p.k.startsWith('rock') ? 0.5 * p.h : Math.min(Math.max(0.16 * p.h, 0.55), 1.2),
  })),
  ...RIM.map((r) => ({ x: r.x, z: r.z, r: 0.48 * r.h })),
]
