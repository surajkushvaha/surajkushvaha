import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
// Preload was removed deliberately: it force-compiles every material in the
// scene up front, which with a 16MB proximity-gated avatar in the graph is a
// long stall for an asset most visitors never walk near.
import { AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Vignette } from '@react-three/postprocessing'
import { N8AO } from '@react-three/postprocessing'
import * as THREE from 'three'
import Terrain from './Terrain'
import Robot from './Robot'
import Cuty from './Cuty'
import Jessica from './Jessica'
import { COLLIDERS } from './scene'
import { ZONES, zoneAt, type Zone } from './zones'
import '../styles/world.css'

/** Live player state. Mutated in the frame loop, never in React state, so
 *  walking does not re-render the tree sixty times a second. */
type Player = {
  x: number
  z: number
  facing: number
  speed: number
  idleFor: number
  vx: number
  vz: number
  /** camera orbit angle. lives here so teleport can aim it at a zone. */
  camYaw: number
}

const SPEED = 15
// the island the player walks, centred and bounded. Kept in sync with
// scene.ts's ISLAND (r 33); clamped a little inside so you never teeter on the
// very rim.
const ISLAND = { cx: 0, cz: -6, r: 30 }
// how wide the player is for collision against trees and rocks
const PLAYER_R = 0.6

function Rig({
  player,
  onZone,
}: {
  player: Player
  onZone: (z: Zone | null) => void
}) {
  const { camera } = useThree()
  const keys = useRef(new Set<string>())
  const drag = useRef<{ on: boolean; x: number }>({ on: false, x: 0 })
  const touch = useRef<{ x: number; y: number } | null>(null)
  const zoneRef = useRef<Zone | null>(null)
  const camPos = useMemo(() => new THREE.Vector3(0, 12, 20), [])
  const lookAt = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault()
      }
      keys.current.add(k)
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase())
    const blur = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  useEffect(() => {
    const el = document.querySelector('.world-canvas') as HTMLElement | null
    if (!el) return
    const down = (e: PointerEvent) => {
      drag.current = { on: true, x: e.clientX }
      if (e.pointerType === 'touch') touch.current = { x: e.clientX, y: e.clientY }
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!drag.current.on) return
      if (e.pointerType === 'touch' && touch.current) {
        touch.current = { x: e.clientX, y: e.clientY }
        return
      }
      player.camYaw -= (e.clientX - drag.current.x) * 0.006
      drag.current.x = e.clientX
    }
    const end = () => {
      drag.current.on = false
      touch.current = null
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', end)
      el.removeEventListener('pointercancel', end)
    }
  }, [])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)

    // ---- input, resolved into world space relative to the camera
    let ix = 0
    let iz = 0
    const k = keys.current
    if (k.has('w') || k.has('arrowup')) iz -= 1
    if (k.has('s') || k.has('arrowdown')) iz += 1
    if (k.has('a') || k.has('arrowleft')) ix -= 1
    if (k.has('d') || k.has('arrowright')) ix += 1

    if (touch.current) {
      ix += (touch.current.x - window.innerWidth / 2) / (window.innerWidth / 2)
      iz += (touch.current.y - window.innerHeight * 0.62) / (window.innerHeight / 2)
    }

    const mag = Math.hypot(ix, iz)
    if (mag > 0.15) {
      ix /= mag
      iz /= mag

      // The camera sits at player - (cos(camYaw), sin(camYaw)) * dist, so
      // "away from the camera" - which is what W has to mean - is exactly
      // (cos(camYaw), sin(camYaw)). Right of that is (-sin, cos).
      //
      // Getting this wrong is not subtle but it is easy to miss: the previous
      // basis was rotated 90 degrees, so W walked you sideways and every
      // teleport dropped the camera between you and the thing you arrived to
      // look at.
      const fwd = -iz // W is -1, and W means forward
      const cy = Math.cos(player.camYaw)
      const sy = Math.sin(player.camYaw)
      const wx = cy * fwd - sy * ix
      const wz = sy * fwd + cy * ix
      const a = 1 - Math.pow(0.0009, dt)
      player.vx += (wx * SPEED - player.vx) * a
      player.vz += (wz * SPEED - player.vz) * a
      player.facing = Math.atan2(player.vz, player.vx)
      player.idleFor = 0
    } else {
      const a = 1 - Math.pow(0.0001, dt)
      player.vx += -player.vx * a
      player.vz += -player.vz * a
      player.idleFor += dt
    }

    player.x += player.vx * dt
    player.z += player.vz * dt

    // ---- solid props: push the player out of any tree trunk or rock it has
    // walked into, and cancel the velocity component going into it so you slide
    // around rather than sticking. One pass is enough at these speeds and
    // spacings; the colliders are the same circles Terrain drew the props on.
    for (const c of COLLIDERS) {
      const dx = player.x - c.x
      const dz = player.z - c.z
      const rr = c.r + PLAYER_R
      const d2 = dx * dx + dz * dz
      if (d2 < rr * rr && d2 > 1e-6) {
        const d = Math.sqrt(d2)
        const nx = dx / d
        const nz = dz / d
        player.x = c.x + nx * rr
        player.z = c.z + nz * rr
        const vn = player.vx * nx + player.vz * nz
        if (vn < 0) {
          player.vx -= vn * nx
          player.vz -= vn * nz
        }
      }
    }

    // keep the player on the island: past the rim, clamp back to it and kill
    // the outward velocity so you slide along the edge instead of jamming.
    const ex = player.x - ISLAND.cx
    const ez = player.z - ISLAND.cz
    const ed = Math.hypot(ex, ez)
    if (ed > ISLAND.r) {
      player.x = ISLAND.cx + (ex / ed) * ISLAND.r
      player.z = ISLAND.cz + (ez / ed) * ISLAND.r
      const nx = ex / ed
      const nz = ez / ed
      const vn = player.vx * nx + player.vz * nz
      player.vx -= vn * nx
      player.vz -= vn * nz
    }
    player.speed = Math.hypot(player.vx, player.vz)

    // ================= the camera =================
    // It trails on a slack spring while you move. When you stop, it drifts in
    // and settles slightly off-axis, which is the shot a game gives you when
    // it wants you to look at the character rather than the road. The robot
    // finds it and looks back (see Robot.tsx).
    const settling = THREE.MathUtils.clamp((player.idleFor - 0.9) / 2.2, 0, 1)
    // Gentler settle than before: the idle camera used to drop to dist 11 /
    // height 5.4, which sat so low that foreground rim rocks swallowed the shot.
    // It now stays higher and further so the island still reads when you stop.
    const dist = THREE.MathUtils.lerp(18, 14.5, settling)
    const height = THREE.MathUtils.lerp(9.5, 7.6, settling)
    // a slow push around the subject once settled, never while you drive
    const orbit = settling * Math.sin(player.idleFor * 0.22) * 0.42

    const tx = player.x - Math.cos(player.camYaw + orbit) * dist
    const tz = player.z - Math.sin(player.camYaw + orbit) * dist
    const follow = 1 - Math.pow(settling > 0.02 ? 0.35 : 0.0015, dt)
    camPos.x += (tx - camPos.x) * follow
    camPos.z += (tz - camPos.z) * follow
    camPos.y += (height - camPos.y) * follow
    camera.position.copy(camPos)

    lookAt.set(player.x, THREE.MathUtils.lerp(2.6, 3.1, settling), player.z)
    camera.lookAt(lookAt)

    // ---- zone transitions, pushed to React only when they actually change
    const z = zoneAt(player.x, player.z)
    if (z !== zoneRef.current) {
      zoneRef.current = z
      onZone(z)
    }
  })

  return null
}

function Lighting() {
  return (
    <>
      {/* The sun, and in a white world it does all the work: with every surface
          the same bone card, SHADOW is the only thing describing form. Hence a
          low, raking angle rather than an overhead one, so everything casts a
          long side shadow and the massing reads.

          Warm sun against a cool sky fill is what makes white card look white
          rather than grey, because the lit faces and the shadowed faces end up
          on opposite sides of neutral. */}
      <directionalLight
        position={[26, 40, 20]}
        intensity={2.1}
        color="#fff2dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-46}
        shadow-camera-right={46}
        shadow-camera-top={46}
        shadow-camera-bottom={-46}
        shadow-camera-far={140}
        shadow-bias={-0.0008}
        shadow-normalBias={0.03}
      />
      {/* cool sky above, soft green bounce off the grass below: keeps the
          shadowed faces on the cool side of neutral so the island reads calm */}
      <hemisphereLight args={['#bcd2f2', '#cfe0d2', 1.05]} />
      <ambientLight intensity={0.3} />
    </>
  )
}

export default function World() {
  const player = useMemo<Player>(
    () => ({
      x: 0,
      z: 10,
      facing: -Math.PI / 2,
      speed: 0,
      idleFor: 0,
      vx: 0,
      vz: 0,
      camYaw: -Math.PI / 2,
    }),
    [],
  )
  const [zone, setZone] = useState<Zone | null>(null)
  const [line, setLine] = useState<string | null>(null)
  const [entered, setEntered] = useState(false)
  const camRef = useRef<THREE.Camera | null>(null)
  const lineTimer = useRef<number>()

  const say = useCallback((text: string, hold = 7000) => {
    setLine(text)
    window.clearTimeout(lineTimer.current)
    lineTimer.current = window.setTimeout(() => setLine(null), hold)
  }, [])

  const onZone = useCallback(
    (z: Zone | null) => {
      setZone(z)
      if (z) say(z.say)
    },
    [say],
  )

  const teleport = useCallback(
    (z: Zone) => {
      // Arrive at the near edge looking INTO the zone. Dropping in facing
      // outward means you land staring at empty ground with the exhibits
      // behind you, which is what it did before.
      player.x = z.at[0]
      player.z = z.at[1] + z.r * 0.62
      player.vx = 0
      player.vz = 0
      player.idleFor = 0
      // You arrive on the near edge and walk north into the zone, so the
      // camera has to be SOUTH of you (behind), not north (in your way).
      player.facing = -Math.PI / 2 // body pointing north
      player.camYaw = -Math.PI / 2 // camera behind, looking north with you
    },
    [player],
  )

  useEffect(() => () => window.clearTimeout(lineTimer.current), [])

  // Dev-only handle on the live player state. Movement bugs in a 3D world are
  // very hard to reason about from the outside and trivial to measure from the
  // inside, so this exists to be measured against rather than guessed at.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { player: Player }).player = player
    ;(window as unknown as { colliders: typeof COLLIDERS }).colliders = COLLIDERS
  }, [player])

  useEffect(() => {
    if (!entered) return
    const t = window.setTimeout(
      () => say("You're here. Good. I'm Cuty, I keep the lights on while he's at work.", 7000),
      700,
    )
    const t2 = window.setTimeout(
      () =>
        say(
          "Everything standing here was built by one of the projects it's showing you. Walk north when you're ready.",
          8000,
        ),
      8000,
    )
    return () => {
      window.clearTimeout(t)
      window.clearTimeout(t2)
    }
  }, [entered, say])

  return (
    <div className="world">
      <Canvas
        className="world-canvas"
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 55, near: 0.5, far: 400, position: [0, 12, 26] }}
        onCreated={({ camera, scene, gl }) => {
          camRef.current = camera
          // Pale haze rather than dark fog, and thin: distance should soften
          // the model, not swallow it. Matched to the sky's horizon tone so
          // the two meet without a seam.
          scene.fog = new THREE.FogExp2('#dce7ef', 0.006)
          // ACES crushes highlights toward grey, which is exactly wrong for a
          // white subject. Neutral tone mapping keeps the card white.
          gl.toneMapping = THREE.NeutralToneMapping
          gl.toneMappingExposure = 1.0
          // R3F's `shadows` shorthand asks for PCFSoft, which three now warns
          // is deprecated; set the supported type explicitly instead
          gl.shadowMap.type = THREE.PCFShadowMap
        }}
      >
        <color attach="background" args={['#e2ecf2']} />
        <Lighting />
        <Suspense fallback={null}>
          <Terrain />
          {camRef.current && <Robot state={player} camera={camRef.current} />}
          <Cuty target={player} />
          {/* she stands in the Gallery zone (22, -6), a little off its centre */}
          <Jessica player={player} at={[24, -9]} />
        </Suspense>
        <Rig player={player} onZone={onZone} />

        {/*
          Bloom is gone with the neon. In a daylight scene it only bleeds the
          white card into the white sky and costs contrast for nothing; there
          are no light sources left to bloom. What replaces it is ambient
          occlusion, which is the correct effect for this subject: it darkens
          the creases where surfaces meet, and on a model where every face is
          the same colour, those creases are the only thing separating one form
          from the next.
        */}
        {/* Depth of field was here and is gone: at this camera distance it blurred
            things the eye wanted sharp and read as a smeared lens rather than as
            atmosphere. Ambient occlusion and a light vignette are the whole post
            chain now. */}
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={1.8} intensity={2.0} distanceFalloff={0.8} halfRes />
          <Vignette eskil={false} offset={0.4} darkness={0.3} />
        </EffectComposer>
        <AdaptiveDpr pixelated />
      </Canvas>

      {/* ---------- HUD ---------- */}
      {/* The way out. This was only on the entry gate, so once you were inside
          the world there was no route back to the written site at all. A plain
          anchor rather than a router link on purpose: a full navigation tears
          down the WebGL context and frees the GPU memory, which a client-side
          route change would leave hanging around. */}
      <a className="w-hud w-exit" href="/">
        ← Back to the site
      </a>

      <div className="w-hud w-zone">
        <span>Now entering</span>
        <b>{zone ? zone.name : 'The Dark'}</b>
      </div>

      <nav className="w-hud w-nav" aria-label="Teleport to zone">
        {ZONES.map((z) => (
          <button
            key={z.id}
            onClick={() => teleport(z)}
            aria-current={zone?.id === z.id}
          >
            {z.name.replace(/^The /, '')}
          </button>
        ))}
      </nav>

      <div className={`w-hud w-talk${line ? ' on' : ''}`} role="status" aria-live="polite">
        <div className="who">Cuty</div>
        <p>{line}</p>
      </div>

      {zone && (
        <aside className="w-hud w-panel on">
          <h3>{zone.panel.heading}</h3>
          <div className="meta">{zone.panel.meta}</div>
          {zone.panel.body?.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {zone.panel.list && (
            <ul>
              {zone.panel.list.map((li) => (
                <li key={li}>{li}</li>
              ))}
            </ul>
          )}
        </aside>
      )}

      <div className="w-hud w-hint">
        W A S D / arrows to walk · drag to turn · stand still and it notices you
      </div>

      {!entered && (
        <div className="w-gate">
          <div className="w-gate-inner">
            <h1>Suraj Kushvaha builds things that move</h1>
            <p>
              This portfolio is a place you walk around. Everything standing in
              it was built by one of the projects it is showing you.
            </p>
            <button className="w-enter" onClick={() => setEntered(true)}>
              Enter the world
            </button>
            <div className="w-keys">WASD or arrows to move · drag to look</div>
            <div className="w-fallback">
              Would rather just read it? <a href="/">Open the plain version</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
