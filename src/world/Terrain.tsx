import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ZONES } from './zones'
import Prop from './Prop'
import { ISLAND, SCATTER, RIM, scaleFor } from './scene'

/**
 * The world: a single small floating island.
 *
 * This replaced an open 300-unit plain of white maquette boxes. The plain
 * failed for a reason worth keeping written down: empty ground is never
 * beautiful, and the scenes that are (the ones on Awwwards) are always small
 * and dense - an island, a room, a corner - not a field you cross. And the
 * white card model was one art style; the world now commits to another, a
 * calm stylized-nature diorama, and does not mix the two. Every tree, rock,
 * bush and mushroom here is a real Quaternius CC0 asset (assets/nature), all
 * from one pack so they share a silhouette and a palette.
 *
 * Form is carried by the assets and the light now, not by generated geometry.
 * The only built mesh is the island itself, because the ground has to come
 * from somewhere; its faceted edge is deliberately hidden behind a ring of
 * real rocks.
 */

// Cool, light, calm. Sage grass over slate rock: both sit on the cool side of
// neutral, so the whole island reads calm rather than the warm bone card it was.
const GRASS = '#93bd97'
const GRASS_2 = '#84b18b'
const ROCK = '#8b95a4'
// the Quaternius rocks ship a warm brown texture that fights the cool island;
// every rock is retinted to this cool slate so it belongs to the same world as
// the island's underside.
const ROCK_COOL = '#98a3b2'

/** small local seeded rng, just for the decorative clouds (the world layout's
 *  rng lives in scene.ts). */
function makeRngLocal(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** a slow-bobbing waypoint gem in the zone's colour: game language for "there
 *  is something here", and clean geometry rather than another box. */
function Waypoint({ x, z, colour, base = 5.4 }: { x: number; z: number; colour: string; base?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    g.position.y = base + Math.sin(t * 1.3 + x) * 0.3
    g.rotation.y = t * 0.6
  })
  return (
    <group>
      {/* soft ground ring marking the zone's footprint */}
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.06, z]}>
        <ringGeometry args={[2.6, 3.1, 48]} />
        <meshBasicMaterial color={colour} transparent opacity={0.5} />
      </mesh>
      <group ref={ref} position={[x, base, z]}>
        <mesh>
          <octahedronGeometry args={[0.62, 0]} />
          <meshStandardMaterial
            color={colour}
            emissive={colour}
            emissiveIntensity={0.55}
            roughness={0.35}
            flatShading
          />
        </mesh>
      </group>
    </group>
  )
}

/** Low, slow clouds ringing the island below its rim. They are what turns a
 *  disc sitting in blue into a landmass floating in sky: something has to pass
 *  underneath it. Cheap flattened blobs, drifting as one slow ring. */
function Clouds() {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.012
  })
  const puffs = useMemo(() => {
    const rnd = makeRngLocal(915)
    return Array.from({ length: 9 }, () => {
      const a = rnd() * Math.PI * 2
      // Pushed out and dropped a long way down. At radius 46-76 and y -7 they
      // sat between an outside camera and the island, where faceted icosahedra
      // read unmistakably as big white ROCKS floating in the sky rather than as
      // cloud. Far below and well outside, they do the job they were added for -
      // something passing underneath, so the island reads as airborne - without
      // ever crossing the subject.
      const rr = 95 + rnd() * 55
      return {
        x: Math.cos(a) * rr,
        y: -34 - rnd() * 22,
        z: ISLAND.cz + Math.sin(a) * rr,
        s: 7 + rnd() * 8,
        // a few lobes per cloud so the silhouette is lumpy, not a single ball
        lobes: Array.from({ length: 3 + ((rnd() * 3) | 0) }, () => ({
          dx: (rnd() - 0.5) * 2.4,
          dy: (rnd() - 0.5) * 0.7,
          dz: (rnd() - 0.5) * 2.0,
          r: 0.7 + rnd() * 0.7,
        })),
      }
    })
  }, [])
  return (
    <group ref={ref}>
      {puffs.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} scale={[p.s, p.s * 0.55, p.s]}>
          {p.lobes.map((l, j) => (
            <mesh key={j} position={[l.dx, l.dy, l.dz]}>
              {/* smoother and softer than the first pass: flatShading on a low
                  icosahedron is what made these look like quarried stone */}
              <icosahedronGeometry args={[l.r, 2]} />
              <meshStandardMaterial
                color="#f2f6fa"
                roughness={1}
                transparent
                opacity={0.5}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** Worn trails linking the zones: a lighter, flatter tone brushed onto the
 *  grass, so the island has a spine to follow without dropping stone tiles all
 *  over a scene that is already dense. A spine south-to-north through the
 *  timeline to the tower, with spurs east and west to gallery and workshop. */
function Paths() {
  const segs: [[number, number], [number, number]][] = [
    [[0, 12], [0, -8]], // clearing -> experience
    [[0, -8], [0, -26]], // experience -> tower
    [[0, -8], [-22, -6]], // -> workshop
    [[0, -8], [22, -6]], // -> gallery
  ]
  return (
    <group>
      {segs.map(([a, b], i) => {
        const mx = (a[0] + b[0]) / 2
        const mz = (a[1] + b[1]) / 2
        const dx = b[0] - a[0]
        const dz = b[1] - a[1]
        const len = Math.hypot(dx, dz)
        const ang = Math.atan2(dz, dx)
        return (
          <mesh key={i} position={[mx, 0.04, mz]} rotation={[-Math.PI / 2, 0, -ang]}>
            <planeGeometry args={[len + 3, 3.4]} />
            <meshStandardMaterial color="#aec7a6" roughness={1} transparent opacity={0.7} />
          </mesh>
        )
      })}
    </group>
  )
}

function Island() {
  return (
    <group position={[ISLAND.cx, 0, ISLAND.cz]}>
      {/* grassy top: a shallow faceted disc. Low segment count + flatShading so
          its facets match the low-poly assets standing on it. Top face at y=0
          so every placed asset sits on the ground with no per-asset offset. */}
      <mesh position-y={-1.4} receiveShadow castShadow>
        <cylinderGeometry args={[ISLAND.r, ISLAND.r - 1.5, 2.8, 13]} />
        <meshStandardMaterial color={GRASS} roughness={1} flatShading />
      </mesh>
      {/* a second, slightly smaller inset gives the ground a subtle terraced
          edge instead of one clean cut, before the rocks cover it */}
      <mesh position-y={-2.4} receiveShadow castShadow>
        <cylinderGeometry args={[ISLAND.r - 2, ISLAND.r - 4, 2.2, 13]} />
        <meshStandardMaterial color={GRASS_2} roughness={1} flatShading />
      </mesh>
      {/* the rock underside, tapering to a point: this is what makes it read as
          a chunk torn loose and floating, not a table. */}
      <mesh position-y={-13} castShadow>
        <coneGeometry args={[ISLAND.r - 3, 22, 12]} />
        <meshStandardMaterial color={ROCK} roughness={1} flatShading />
      </mesh>
    </group>
  )
}

/**
 * The sky dome.
 *
 * The gradient is baked into the geometry as vertex colours rather than drawn
 * by a shader. It used to be a raw-GLSL ShaderMaterial, which the WebGPU
 * renderer rejects outright ("Material ShaderMaterial is not compatible") -
 * WebGPU wants TSL node graphs, not hand-written GLSL. Rewriting it as a node
 * material would work, but for a static two-stop vertical ramp it is far less
 * machinery to colour the vertices once at build time and let an ordinary
 * unlit material interpolate them. Same picture, no shader, and it runs
 * unchanged on either backend.
 */
function Sky() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(300, 32, 16)
    // cool and light: periwinkle overhead melting to a pale cyan haze
    const top = new THREE.Color('#aab8ec')
    const bottom = new THREE.Color('#e8f1f4')
    const pos = g.attributes.position
    const colours = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      // normalised height of this vertex on the dome, biased so the pale band
      // hugs the horizon the way the old pow(h, 0.42) curve did
      const h = Math.max(pos.getY(i) / 300, 0)
      c.copy(bottom).lerp(top, Math.pow(h, 0.5))
      colours[i * 3] = c.r
      colours[i * 3 + 1] = c.g
      colours[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colours, 3))
    return g
  }, [])

  return (
    <mesh scale={[-1, 1, 1]} geometry={geo}>
      <meshBasicMaterial vertexColors depthWrite={false} fog={false} />
    </mesh>
  )
}

export default function Terrain() {
  const scatter = SCATTER
  const rim = RIM

  return (
    <group>
      <Sky />
      <Clouds />
      <Island />
      <Paths />

      <Suspense fallback={null}>
        {rim.map((r, i) => (
          <Prop
            key={`rim${i}`}
            url={`nature/${r.big ? 'rock-large' : 'rock-s'}.glb`}
            position={[r.x, r.y, r.z]}
            rotation={r.rot}
            scale={scaleFor(r.big ? 'rock-large' : 'rock-s', r.h)}
            colour={ROCK_COOL}
          />
        ))}

        {scatter.map((p, i) => (
          <Prop
            key={i}
            url={`nature/${p.k}.glb`}
            position={[p.x, p.y, p.z]}
            rotation={p.rot}
            scale={scaleFor(p.k, p.h)}
            colour={p.k.startsWith('rock') ? ROCK_COOL : undefined}
          />
        ))}
      </Suspense>

      {ZONES.map((z) => (
        <Waypoint
          key={z.id}
          x={z.at[0]}
          z={z.at[1]}
          colour={z.light}
          // the tower's gem rides above its hero pine as a beacon; the rest
          // float at head height over open ground
          base={z.id === 'tower' ? 13.5 : 5.4}
        />
      ))}
    </group>
  )
}
