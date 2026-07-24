import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin, type VRM } from '@pixiv/three-vrm'
import * as THREE from 'three'

/**
 * Jessica, the AI VTuber, standing in her own exhibit.
 *
 * This is the real 16MB VRM out of the Jessica project rather than a stand-in,
 * which is the entire point: the gallery is supposed to contain the work, not
 * pictures of the work.
 *
 * She is gated on proximity and never mounted until you are close, because a
 * 16MB avatar has no business loading for someone who walks straight to the
 * contact tower. Once loaded she stays: unloading and reloading on every pass
 * would be worse than the one-time cost.
 *
 * Two things about that gate are load-bearing, and both were wrong before:
 *
 * 1. The radius has to be small relative to the island. It was 34 units on an
 *    island of radius 33, so *spawn* was inside it and the 16MB file was
 *    fetched immediately on entry - 76% of the world's payload, blocking the
 *    first frame. It is now a genuine "you walked over here" distance.
 * 2. Mounting is not the same as fetching. Waiting until you are close and
 *    THEN starting a 16MB download just moves the stall from startup to the
 *    moment you arrive. So the file is warmed in the background once the world
 *    is up and idle, and the mount below only decides when to *show* her.
 *
 * She cannot be shrunk the easy way: gltf-transform strips VRMC_vrm,
 * VRMC_springBone and VRMC_materials_mtoon, which leaves a file three-vrm
 * cannot read as a VRM at all. Compressing her needs a VRM-aware tool.
 */

const URL = `${import.meta.env.BASE_URL}jessica.vrm`

function Model({ watch }: { watch: THREE.Vector3 }) {
  const gltf = useLoader(GLTFLoader, URL, (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser))
  })

  const vrm = (gltf.userData as { vrm?: VRM }).vrm
  const spin = useRef(0)

  useEffect(() => {
    if (!vrm) return
    vrm.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        // VRM meshes are skinned and their bounds do not follow the pose, so
        // three culls them the moment the bind-pose box leaves the frustum
        m.frustumCulled = false
      }
    })

    // A loaded VRM sits in its bind pose, which is a T-pose: arms straight out,
    // the single most obviously-unfinished thing a 3D character can do. The
    // humanoid rig is normalised by spec, so a handful of bone rotations buys a
    // relaxed idle without needing an animation clip at all.
    const h = vrm.humanoid
    if (!h) return
    const set = (name: Parameters<typeof h.getNormalizedBoneNode>[0], x = 0, y = 0, z = 0) => {
      const b = h.getNormalizedBoneNode(name)
      if (b) b.rotation.set(x, y, z)
    }
    // arms down at roughly 75 degrees, elbows softened, not locked straight
    set('leftUpperArm', 0, 0, -1.31)
    set('rightUpperArm', 0, 0, 1.31)
    set('leftLowerArm', 0, -0.22, -0.12)
    set('rightLowerArm', 0, 0.22, 0.12)
    set('leftHand', 0, 0, -0.1)
    set('rightHand', 0, 0, 0.1)
    // weight on one hip, so she stands rather than presents
    set('spine', 0.03, 0, 0.02)
    set('leftUpperLeg', 0, 0, 0.04)
    set('rightUpperLeg', 0, 0, 0.03)
    h.update()
  }, [vrm])

  useFrame((_, dtRaw) => {
    if (!vrm) return
    const dt = Math.min(dtRaw, 0.05)
    spin.current += dt

    // Breathing, composed on top of the idle pose set above. Without it she is
    // a mannequin, and a frozen avatar in an exhibit about a *live* VTuber
    // would be arguing against itself.
    const h = vrm.humanoid
    if (h) {
      const chest = h.getNormalizedBoneNode('chest')
      const head = h.getNormalizedBoneNode('head')
      const breath = Math.sin(spin.current * 1.4)
      if (chest) chest.rotation.x = breath * 0.022
      // two incommensurable sines, so the head never repeats on a loop
      if (head) {
        head.rotation.y = Math.sin(spin.current * 0.37) * 0.12
        head.rotation.x = Math.sin(spin.current * 0.53) * 0.05
      }
    }

    vrm.update(dt)

    // She tracks whoever is in her exhibit. The VRM spec ships a lookAt rig for
    // exactly this, so it moves her eyes rather than swivelling her skull.
    if (vrm.lookAt) vrm.lookAt.lookAt(watch)

    // a slow turn on the plinth, so she reads as an exhibit rather than a prop
    vrm.scene.rotation.y = Math.sin(spin.current * 0.16) * 0.5
  })

  if (!vrm) return null
  // scaled up so she reads at the same visual weight as the other exhibits;
  // VRM authoring units put her at roughly human height, which is small next
  // to a 7-unit plinth
  return <primitive object={vrm.scene} scale={1.65} />
}

export default function Jessica({
  player,
  at,
}: {
  player: { x: number; z: number }
  at: [number, number]
}) {
  const [near, setNear] = useState(false)
  const watch = useMemo(() => new THREE.Vector3(), [])

  // Warm the file in the background once the world is up, so that walking into
  // the gallery never pays a 16MB download at that moment. This only fills the
  // HTTP cache; nothing is parsed or added to the scene until `near` flips.
  useEffect(() => {
    let cancelled = false
    const warm = () => {
      if (!cancelled) fetch(URL, { cache: 'force-cache' }).catch(() => {})
    }
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: object) => number })
      .requestIdleCallback
    const id = ric ? ric(warm, { timeout: 6000 }) : window.setTimeout(warm, 3500)
    return () => {
      cancelled = true
      const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback
      if (ric && cic) cic(id)
      else window.clearTimeout(id)
    }
  }, [])

  useFrame(() => {
    const d = Math.hypot(player.x - at[0], player.z - at[1])
    // a real proximity distance now: the gallery, not the whole island
    if (d < 15 && !near) setNear(true)
    watch.set(player.x, 2.4, player.z)
  })

  return (
    <group position={[at[0], 1.15, at[1]]}>
      {near && <Model watch={watch} />}
      {/* The violet fill that used to stand here is gone. It was doing a job in
          the dark version; under daylight it just smeared purple across the
          white plinth and read as a light leak. She is the most saturated thing
          in a bone-white world, which is more than enough emphasis. */}
    </group>
  )
}
