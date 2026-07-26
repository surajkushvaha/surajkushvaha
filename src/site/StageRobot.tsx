import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useGraph, type ThreeEvent } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'

/**
 * The robot, as the signature scene's subject.
 *
 * Two things drive this component, both taken from Suraj's references:
 *
 * 1. **Talking Tom.** Poking the face, the belly and the feet each give a
 *    DIFFERENT reaction, and one of them is the character tapping on the
 *    camera. That variety is the whole appeal - a single shared "poked"
 *    animation is a toy, a specific response per part is a character. It also
 *    settles his note that expressions be deliberate rather than random: every
 *    reaction below is mapped to a part and a meaning, and nothing is picked
 *    with Math.random.
 *
 * 2. **The fourth wall**, which was his very first request and has never
 *    actually shipped. Stand still and it finds the camera and looks at you;
 *    poke it enough times and it stops pretending there is no camera at all
 *    and taps the lens.
 */

const URL = `${import.meta.env.BASE_URL}robot.glb`

/** world height the robot is normalised to. The hit boxes below are derived from
 *  it, so the two can never drift apart again. */
const HEIGHT = 9.5

/**
 * Where it stands, exported so the camera path can frame it without the two
 * drifting apart.
 *
 * Derived from the camera's basis rather than chosen by eye:
 * screen-right = cross(up, normalize(camera - target)), which on the establishing
 * arc is (-0.872, 0.364) in xz - the NEGATIVE x direction. Two earlier guesses
 * used +x and +z and both hid the robot, once behind the island and once behind
 * the headline. This is 22 units screen-right of the island's centre and 12
 * nearer the lens, which lands it in the open right of frame.
 */
export const ROBOT_AT: [number, number, number] = [-23.6, 0, -9.2]

type Reaction = {
  /** clip in robot.glb */
  clip: 'Wave' | 'Yes' | 'No' | 'Jump' | 'Dance'
  /** eye shape: open amount, outward tilt, glow multiplier */
  face: [number, number, number]
  /** what it is "saying", shown as a caption */
  line: string
}

/**
 * Per-part reactions. Deliberate, one each, no randomness.
 * Eye numbers: squashed + tilted out reads as a smile (a crescent), tall and
 * wide reads as surprise, narrowed and tilted in reads as a scowl.
 */
const BY_PART: Record<string, Reaction> = {
  head: { clip: 'No', face: [0.5, -0.3, 0.85], line: 'Not the head.' },
  body: { clip: 'Yes', face: [0.32, 0.34, 1.35], line: 'That tickles.' },
  legs: { clip: 'Jump', face: [1.45, 0, 1.6], line: 'Warn me next time.' },
}
/** the fourth wall: earned, not random. Fires on the third poke. */
const FOURTH_WALL: Reaction = {
  clip: 'Wave',
  face: [1.2, 0.1, 1.5],
  line: 'You know you are on the other side of a screen, right?',
}

export default function StageRobot({
  onSay,
}: {
  onSay: (line: string | null) => void
}) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(URL)

  const cloned = useMemo(() => {
    const c = skeletonClone(scene)
    // normalise height from the geometry's own bounds. Deliberately not
    // Box3.setFromObject: on a SkinnedMesh that walks every vertex through its
    // bones, and a skeleton fresh out of SkeletonUtils is not bound yet, so it
    // dereferences a missing bone and throws.
    const box = new THREE.Box3()
    const v = new THREE.Vector3()
    c.updateWorldMatrix(true, true)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh || !m.geometry) return
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox()
      const bb = m.geometry.boundingBox
      if (!bb) return
      for (let i = 0; i < 8; i++) {
        v.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z)
        box.expandByPoint(v.applyMatrix4(m.matrixWorld))
      }
    })
    const size = box.getSize(new THREE.Vector3())
    // 9.5 units, against 8-unit pines, from 100 units out. The walkable view's
    // 2.4 made the subject of the shot a few pale pixels on pale ground - a
    // white robot on a light island under a light sky simply disappears at that
    // size. Standing slightly taller than the trees on the near rim, it reads as
    // the character the composition is about rather than as set dressing.
    // 9.5 units, against 8-unit pines, from 100 units out. The walkable view's
    // 2.4 made the subject of the shot a few pale pixels on pale ground - a
    // white robot on a light island under a light sky simply disappears at that
    // size. Standing slightly taller than the trees on the near rim, it reads as
    // the character the composition is about rather than as set dressing.
    const s = HEIGHT / (size.y || 1)
    c.scale.setScalar(s)
    c.position.y = -box.min.y * s
    return c
  }, [scene])

  const { nodes } = useGraph(cloned)
  const { actions, mixer } = useAnimations(animations, cloned)

  const bones = useMemo(
    () => ({
      head: nodes.Head as THREE.Bone,
      eyeL: nodes.Eye_L as THREE.Object3D,
      eyeR: nodes.Eye_R as THREE.Object3D,
    }),
    [nodes],
  )
  const restHead = useMemo(() => bones.head?.quaternion.clone(), [bones.head])

  // white body, black face, white eyes - the scheme Suraj asked for
  useEffect(() => {
    cloned.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      const mat = (m.material as THREE.MeshStandardMaterial).clone()
      if (mat.name === 'Eye') {
        mat.color = new THREE.Color('#ffffff')
        mat.emissive = new THREE.Color('#ffffff')
        mat.emissiveIntensity = 0.5
        mat.roughness = 0.3
      } else if (mat.name === 'Visor') {
        mat.color = new THREE.Color('#0d0f12')
        mat.roughness = 0.38
      } else {
        mat.color = new THREE.Color('#f3f4f6')
        mat.roughness = 0.58
        mat.metalness = 0
      }
      m.material = mat
    })
  }, [cloned])

  // idle loop underneath everything
  useEffect(() => {
    const idle = actions.Idle
    idle?.reset().fadeIn(0.4).play()
    return () => void idle?.fadeOut(0.2)
  }, [actions])

  const pokes = useRef(0)
  const busyUntil = useRef(0)
  const face = useRef({ o: 1, t: 0, g: 1 })
  const faceTarget = useRef<[number, number, number]>([1, 0, 1])
  const blink = useRef({ next: 2200, t: 0, open: 1 })
  const lean = useRef(0)
  const leanTarget = useRef(0)
  const [, force] = useState(0)

  const react = (part: keyof typeof BY_PART) => {
    pokes.current += 1
    // every third poke it breaks the fourth wall instead. Earned by repetition,
    // which is what makes it feel discovered rather than scripted.
    const r = pokes.current % 3 === 0 ? FOURTH_WALL : BY_PART[part]
    const clip = actions[r.clip]
    if (clip) {
      clip.reset()
      clip.setLoop(THREE.LoopOnce, 1)
      clip.clampWhenFinished = true
      clip.fadeIn(0.1).play()
      busyUntil.current = performance.now() + clip.getClip().duration * 1000
    }
    faceTarget.current = r.face
    // on the fourth-wall beat it leans in toward the lens
    leanTarget.current = r === FOURTH_WALL ? 1 : 0
    onSay(r.line)
    window.setTimeout(() => {
      faceTarget.current = [1, 0, 1]
      leanTarget.current = 0
      onSay(null)
    }, 2800)
    force((n) => n + 1)
  }

  const poke = (part: keyof typeof BY_PART) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (performance.now() < busyUntil.current) return
    react(part)
  }

  useFrame(({ camera, clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    mixer.update(0) // the actions drive themselves; keep the mixer in step
    const g = group.current
    if (!g) return

    // ---- the fourth wall: it always knows where the camera is
    const t = clock.elapsedTime
    lean.current += (leanTarget.current - lean.current) * (1 - Math.pow(0.02, dt))
    if (bones.head && restHead) {
      const hp = new THREE.Vector3()
      bones.head.getWorldPosition(hp)
      const dir = camera.position.clone().sub(hp)
      const yaw = Math.atan2(dir.x, dir.z) - g.rotation.y
      const pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) * -0.35
      const sway = Math.sin(t * 0.6) * 0.05 + Math.sin(t * 0.27) * 0.03
      bones.head.quaternion.copy(restHead).multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            THREE.MathUtils.clamp(pitch, -0.3, 0.3) + lean.current * 0.12,
            THREE.MathUtils.clamp(yaw, -1.1, 1.1) * 0.85 + sway,
            0,
          ),
        ),
      )
    }

    // ---- breathing, and a small lean toward the lens on the fourth-wall beat
    g.position.y = Math.sin(t * 1.1) * 0.035 + lean.current * 0.12
    g.rotation.y = -0.22 + Math.sin(t * 0.14) * 0.05

    // ---- face, lerped so expressions land quickly but never snap
    const k = 1 - Math.pow(0.015, dt)
    face.current.o += (faceTarget.current[0] - face.current.o) * k
    face.current.t += (faceTarget.current[1] - face.current.t) * k
    face.current.g += (faceTarget.current[2] - face.current.g) * k

    blink.current.t += dt * 1000
    if (blink.current.t > blink.current.next) {
      blink.current.t = 0
      blink.current.next = 2400 + 3600 * ((Math.sin(t * 12.9898) + 1) / 2)
    }
    const bt = blink.current.t
    const openAmt = bt < 70 ? 1 - bt / 70 : bt < 150 ? (bt - 70) / 80 : 1
    const open = Math.max(0.08, openAmt) * face.current.o

    for (const [eye, sign] of [
      [bones.eyeL, 1],
      [bones.eyeR, -1],
    ] as const) {
      if (!eye) continue
      eye.scale.set(1, open, 1)
      eye.rotation.z = face.current.t * sign
    }
  })

  /**
   * Hit targets. Invisible boxes rather than the mesh itself: the robot is one
   * skinned mesh per material, so its geometry does not divide into head /
   * body / legs, and raycasting a skinned mesh every pointer move is expensive.
   * Three boxes are exact enough for a poke and cost nothing.
   */
  /**
   * Hit targets, in world units for a HEIGHT-tall robot.
   *
   * Two things were wrong the first time and both silently killed the poke:
   *
   *  - the boxes were authored at the GLB's native ~1.5-unit scale while the
   *    normalising scale lives inside `cloned`, so the visible robot was 9.5
   *    units tall and its hit boxes were a knee-high cluster at its feet;
   *  - they were `visible={false}`, and three's raycaster skips invisible
   *    objects outright, so even a correctly placed box would never have been
   *    hit. A fully transparent material is raycastable; an invisible one is not.
   *
   * Boxes rather than the mesh itself because the robot is one skinned mesh per
   * material, so its geometry does not divide into head / body / legs, and
   * raycasting a skinned mesh on every pointer move is expensive.
   */
  const hit = (y: number, w: number, h: number) => (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[w, h, w]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )

  return (
    <group ref={group}>
      <primitive object={cloned} />
      <group onPointerDown={poke('head')}>{hit(HEIGHT * 0.86, 2.6, 2.4)}</group>
      <group onPointerDown={poke('body')}>{hit(HEIGHT * 0.56, 3.2, 2.8)}</group>
      <group onPointerDown={poke('legs')}>{hit(HEIGHT * 0.2, 2.8, 3.6)}</group>
    </group>
  )
}

useGLTF.preload(URL)
