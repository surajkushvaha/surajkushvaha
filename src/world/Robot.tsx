import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'

/**
 * The player character.
 *
 * Locomotion is procedural, not a baked clip, and that is a deliberate call.
 * robot.glb ships Idle/Wave/Yes/No/Jump/Dance and no walk cycle at all, but
 * more importantly a fixed-speed clip in a free-movement world always slides
 * its feet against the ground. Driving the legs from actual velocity means the
 * gait is correct at every speed for free, and mechanical motion suits a robot
 * anyway.
 *
 * The idle behaviour is the point of the whole thing: stop moving and it
 * notices the camera and turns to look at you. That is the fourth wall.
 */

const URL = `${import.meta.env.BASE_URL}robot.glb`

type Props = {
  /** live state, mutated by the controller each frame (avoids re-renders) */
  state: {
    x: number
    z: number
    facing: number
    speed: number
    /** seconds since the player last gave input */
    idleFor: number
  }
  camera: THREE.Camera
}

export default function Robot({ state, camera }: Props) {
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF(URL)

  // clone so the same GLB can be mounted more than once without sharing a skeleton
  const cloned = useMemo(() => {
    const c = skeletonClone(scene)
    // Normalise to a known height from the asset's own bounds rather than
    // trusting whatever scale it was exported at. Without this the robot
    // renders at native GLB scale and Cuty, which is authored in world units,
    // ends up towering over the player.
    const TARGET_H = 2.4
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const s = TARGET_H / (size.y || 1)
    c.scale.setScalar(s)
    c.position.y = -box.min.y * s
    return c
  }, [scene])
  const { nodes } = useGraph(cloned)

  const bones = useMemo(
    () => ({
      torso: nodes.Torso as THREE.Bone,
      head: nodes.Head as THREE.Bone,
      armL: nodes.Arm_L as THREE.Bone,
      armR: nodes.Arm_R as THREE.Bone,
      legL: nodes.Leg_L as THREE.Bone,
      legR: nodes.Leg_R as THREE.Bone,
      eyeL: nodes.Eye_L as THREE.Bone,
      eyeR: nodes.Eye_R as THREE.Bone,
    }),
    [nodes],
  )

  // rest pose, captured once. every procedural rotation is composed on top of
  // these rather than assigning over them, so the model never flattens.
  const rest = useMemo(() => {
    const r: Record<string, THREE.Quaternion> = {}
    for (const [k, b] of Object.entries(bones)) {
      if (b) r[k] = b.quaternion.clone()
    }
    return r
  }, [bones])

  // The baked clips (Idle/Wave/Yes/No/Jump/Dance) are deliberately not mounted.
  // They animate the same arm and leg bones the procedural gait writes to, so
  // running both would mean two systems fighting over one skeleton. Blending
  // them properly is its own feature; until then locomotion owns the rig.

  // paint the robot: a white body with a black face and white eyes. This is a
  // fixed scheme, not pulled from the site tokens, because it is what Suraj
  // asked for specifically and it reads cleanly against the cool green island.
  useEffect(() => {
    cloned.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      const mat = m.material as THREE.MeshStandardMaterial
      if (mat.name === 'Eye') {
        // white eyes, faintly lit so they read as eyes and not just holes in
        // the black face
        mat.color = new THREE.Color('#ffffff')
        mat.emissive = new THREE.Color('#ffffff')
        mat.emissiveIntensity = 0.45
        mat.roughness = 0.35
      } else if (mat.name === 'Visor') {
        // the face: near-black, so the white eyes pop off it
        mat.color = new THREE.Color('#0d0f12')
        mat.roughness = 0.4
      } else {
        // the shell: off-white, not pure white, so its own facets still catch
        // light and shadow instead of blowing out flat
        mat.color = new THREE.Color('#f2f3f5')
        mat.roughness = 0.6
        mat.metalness = 0
      }
    })
  }, [cloned])

  const gait = useRef(0)
  const look = useRef({ yaw: 0, pitch: 0, weight: 0 })
  const blink = useRef({ next: 2, t: 0, open: 1 })
  const camPos = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const g = group.current
    if (!g) return

    g.position.set(state.x, 0, state.z)

    // The mesh faces +Z at rest. `facing` is atan2(vz, vx), measured from +X.
    //
    // Rotating the mesh by t maps its forward (0,0,1) to (sin t, 0, cos t), and
    // we need that to equal (cos facing, sin facing). So sin t = cos facing and
    // cos t = sin facing, which gives t = PI/2 - facing.
    //
    // The obvious-looking `facing + PI/2` is the mirror of this: it happens to
    // be right for A and D and is 180 degrees out for W and S, so the robot
    // moonwalked north and south while strafing correctly.
    g.rotation.y = Math.PI / 2 - state.facing

    const moving = state.speed > 0.35

    // ---- gait: phase advances with distance travelled, never with time,
    // which is precisely what stops the feet skating.
    gait.current += state.speed * dt * 1.15
    const swing = moving ? Math.sin(gait.current) : 0
    const amp = Math.min(state.speed / 9, 1) * 0.85

    if (bones.legL && bones.legR) {
      bones.legL.quaternion
        .copy(rest.legL)
        .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(swing * amp, 0, 0)))
      bones.legR.quaternion
        .copy(rest.legR)
        .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-swing * amp, 0, 0)))
    }
    // arms counter-swing, which is most of what reads as walking
    if (bones.armL && bones.armR) {
      bones.armL.quaternion
        .copy(rest.armL)
        .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-swing * amp * 0.7, 0, 0)))
      bones.armR.quaternion
        .copy(rest.armR)
        .multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(swing * amp * 0.7, 0, 0)))
    }
    // torso bobs at twice the leg cadence and leans into the run
    if (bones.torso) {
      const bob = Math.abs(Math.cos(gait.current)) * amp * 0.07
      bones.torso.quaternion
        .copy(rest.torso)
        .multiply(
          new THREE.Quaternion().setFromEuler(
            new THREE.Euler(moving ? amp * 0.12 : 0, 0, Math.sin(gait.current * 2) * amp * 0.03),
          ),
        )
      g.position.y = bob * 0.25
    }

    // ================= the fourth wall =================
    // Stand still for a beat and it stops being a puppet: it finds the camera
    // and looks at you. The delay matters. Snapping to face the lens the
    // instant you release the key reads as a bug, not as attention.
    const wantLook = !moving && state.idleFor > 1.1 ? 1 : 0
    look.current.weight += (wantLook - look.current.weight) * (1 - Math.pow(0.02, dt))

    camera.getWorldPosition(camPos)
    const dx = camPos.x - state.x
    const dz = camPos.z - state.z
    // relative to where the body is already pointing, so it turns its head
    // rather than spinning on the spot
    // measured against the body's ACTUAL yaw, which is PI/2 - facing (above).
    // Using the old mirrored offset here made it turn its head away from the
    // camera whenever it was walking north or south.
    let rel = Math.atan2(dx, dz) - (Math.PI / 2 - state.facing)
    while (rel > Math.PI) rel -= Math.PI * 2
    while (rel < -Math.PI) rel += Math.PI * 2
    // a neck has a limit; past it, it just looks away
    const yaw = THREE.MathUtils.clamp(rel, -1.15, 1.15)
    const pitch = THREE.MathUtils.clamp(
      Math.atan2(camPos.y - 2.6, Math.hypot(dx, dz)) * 0.5,
      -0.3,
      0.35,
    )

    const k = 1 - Math.pow(0.015, dt)
    look.current.yaw += (yaw - look.current.yaw) * k
    look.current.pitch += (pitch - look.current.pitch) * k

    if (bones.head) {
      const w = look.current.weight
      // idle sway so it is never perfectly still, even while watching you
      const t = performance.now() / 1000
      const sway = moving ? 0 : Math.sin(t * 0.7) * 0.05 + Math.sin(t * 0.31) * 0.03
      bones.head.quaternion.copy(rest.head).multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(look.current.pitch * w, look.current.yaw * w + sway, 0),
        ),
      )
    }

    // ---- blinking, on an irregular beat
    blink.current.t += dt
    if (blink.current.t > blink.current.next) {
      blink.current.t = 0
      blink.current.next = 2.4 + Math.random() * 4
    }
    const bt = blink.current.t
    blink.current.open = bt < 0.06 ? 1 - bt / 0.06 : bt < 0.13 ? (bt - 0.06) / 0.07 : 1
    const open = Math.max(0.06, blink.current.open)
    if (bones.eyeL) bones.eyeL.scale.set(1, open, 1)
    if (bones.eyeR) bones.eyeR.scale.set(1, open, 1)
  })

  // the outer group owns the world transform; the clone keeps its own
  // normalising scale and ground offset, which would otherwise be overwritten
  return (
    <group ref={group}>
      <primitive object={cloned} dispose={null} />
    </group>
  )
}

useGLTF.preload(URL)
