import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * A processed prop from `assets/props/`.
 *
 * Everything in that folder has already been through `scripts/prop.py`, so it
 * arrives triangulated, decimated, textureless, sitting on its own origin and
 * scaled to a known height. That is why this component is almost empty: the
 * expensive, fiddly work happens once at build time in Blender rather than on
 * every visitor's machine.
 */
export default function Prop({
  url,
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  colour,
}: {
  url: string
  position?: [number, number, number]
  rotation?: number
  scale?: number
  /** override the card colour, for the few props that want to read darker */
  colour?: string
}) {
  // A bare name lives in props/; a name with a slash (e.g. "nature/tree-a.glb")
  // is a full path from the assets root, so the same component serves the
  // built maquette kit and the downloaded Quaternius nature assets.
  const path = url.includes('/') ? url : `props/${url}`
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}${path}`)

  const model = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
      if (colour) {
        // clone first: the cached GLTF material is shared across every
        // instance, so tinting in place would repaint all of them
        const mat = (m.material as THREE.MeshStandardMaterial).clone()
        mat.color = new THREE.Color(colour)
        // drop the baked texture too. These assets ship a warm brown rock map;
        // multiplying a cool tint over it goes muddy, so for a recoloured prop
        // we want the flat tint to read pure, matching the faceted island.
        mat.map = null
        mat.flatShading = true
        mat.roughness = 1
        mat.needsUpdate = true
        m.material = mat
      }
    })
    return c
  }, [scene, colour])

  return (
    <primitive object={model} position={position} rotation-y={rotation} scale={scale} />
  )
}
