import { Suspense, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, N8AO } from '@react-three/postprocessing'
import * as THREE from 'three'
import Terrain from '../world/Terrain'
import { ISLAND } from '../world/scene'
import StageRobot, { ROBOT_AT } from './StageRobot'

/**
 * The signature scene.
 *
 * growon.kr states the principle in its own subtitle: "websites anchored by one
 * memorable signature scene". Haunted House and abeto both prove a floating
 * island is worth anchoring to. So this is the island - the same `Terrain` the
 * walkable route builds, imported rather than copied, so the place you land on
 * is literally the one you walk on if you enter.
 *
 * Scroll flies the camera in. That is the technique igloo and Haunted House both
 * use and the single biggest thing the old hero was missing: a static shot is a
 * picture, a shot you move through is a place.
 */

/**
 * The flight path, as three keyframes.
 *
 * Angles are measured on the same arc the establishing shot sits on. Working in
 * (angle, radius, height, target) rather than raw xyz matters here: the island
 * is round, so an orbit is the only camera move that cannot clip through it, and
 * lerping raw positions between two points on a circle would cut the chord and
 * fly the camera through the rock.
 */
const PATH = [
  // wide: the whole island, air all round it, underside visible
  { a: -Math.PI * 0.62, r: 100, h: 31, t: [ISLAND.cx + 2, -4, ISLAND.cz] },
  // closer, swinging round and dropping toward the treeline
  { a: -Math.PI * 0.5, r: 62, h: 18, t: [ISLAND.cx, 3, ISLAND.cz] },
  // down among it, framed on the robot. r=42 rather than the 34 first tried:
  // the rim rocks reach ~6.6 units and sit out at radius 32.5, so a camera at 34
  // and h 9.5 grazes them. `scripts/check_camera_path.mjs` asserts the whole
  // path stays outside the island's solid volume and still frames the robot.
  { a: -Math.PI * 0.4, r: 42, h: 11, t: [ROBOT_AT[0] * 0.5, 6, ROBOT_AT[2] * 0.5] },
] as const

const lerp = THREE.MathUtils.lerp
/** ease so the fly-in settles rather than arriving at constant speed */
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)

function Flight({ progress }: { progress: RefObject<number> }) {
  const target = new THREE.Vector3()
  useFrame(({ camera, clock }) => {
    const p = ease(THREE.MathUtils.clamp(progress.current ?? 0, 0, 1))
    // which pair of keyframes we are between, and how far
    const seg = p * (PATH.length - 1)
    const i = Math.min(Math.floor(seg), PATH.length - 2)
    const f = seg - i
    const A = PATH[i]
    const B = PATH[i + 1]

    const a = lerp(A.a, B.a, f)
    const r = lerp(A.r, B.r, f)
    const h = lerp(A.h, B.h, f)
    const t = clock.elapsedTime

    // the held shot still breathes, but only while wide: a drift this size is
    // atmosphere at 100 units out and seasickness at 34
    const breathe = (1 - p) * 1.6

    camera.position.set(
      ISLAND.cx + Math.cos(a) * r,
      h + Math.sin(t * 0.16) * breathe,
      ISLAND.cz + Math.sin(a) * r,
    )
    target.set(
      lerp(A.t[0], B.t[0], f),
      lerp(A.t[1], B.t[1], f),
      lerp(A.t[2], B.t[2], f),
    )
    camera.lookAt(target)
  })
  return null
}

export default function StageScene({
  progress,
  onSay,
}: {
  progress: RefObject<number>
  onSay: (line: string | null) => void
}) {
  return (
    <Canvas
      className="st-canvas"
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 40, near: 1, far: 600, position: [0, 31, 100] }}
      onCreated={({ scene, gl }) => {
        // Thicker than the walkable view. Seen from outside, the island needs air
        // around it to read as floating rather than as a model on a table; this
        // is the haze igloo and Haunted House both sit their subject inside.
        scene.fog = new THREE.FogExp2('#dfe9f1', 0.0052)
        gl.toneMapping = THREE.NeutralToneMapping
        gl.toneMappingExposure = 1.04
        gl.shadowMap.type = THREE.PCFShadowMap
      }}
    >
      {/* Flat colour, with the vignette in CSS on top. growon builds its depth
          from a radial gradient behind the subject; in CSS it costs nothing and
          cannot fight the ambient occlusion the way a post pass would. */}
      <color attach="background" args={['#e4edf3']} />

      {/* the world's rig: a warm raking sun against a cool sky fill, which is
          what keeps pale surfaces reading as white rather than grey */}
      <directionalLight
        position={[30, 44, 22]}
        intensity={2.25}
        color="#fff3de"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-far={150}
        shadow-bias={-0.0008}
        shadow-normalBias={0.03}
      />
      <hemisphereLight args={['#bcd2f2', '#cfe0d2', 1.0]} />
      <ambientLight intensity={0.32} />

      <Suspense fallback={null}>
        <Terrain />
        <group position={[ROBOT_AT[0], ROBOT_AT[1], ROBOT_AT[2]]}>
          <StageRobot onSay={onSay} />
        </group>
      </Suspense>

      <Flight progress={progress} />

      <EffectComposer multisampling={4}>
        <N8AO aoRadius={1.9} intensity={2.1} distanceFalloff={0.8} halfRes />
      </EffectComposer>
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
