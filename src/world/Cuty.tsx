import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The companion.
 *
 * Cuty is built from primitives rather than loaded, because it is four boxes
 * and a light and shipping another GLB for that would be silly.
 *
 * It hangs off your shoulder with a slack spring, so it arrives a beat after
 * you do. That lag is the whole character: something keeping up with you,
 * rather than something welded to your side.
 */

type Props = {
  target: { x: number; z: number; facing: number }
}

export default function Cuty({ target }: Props) {
  const g = useRef<THREE.Group>(null)
  const pos = useRef(new THREE.Vector3(2.6, 3, 3))
  const want = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const group = g.current
    if (!group) return

    const t = clock.elapsedTime

    // just behind and to the right of the player's shoulder
    want.set(
      target.x - Math.cos(target.facing) * 1.4 + Math.cos(target.facing + Math.PI / 2) * 2.6,
      3 + Math.sin(t * 1.1) * 0.16,
      target.z - Math.sin(target.facing) * 1.4 + Math.sin(target.facing + Math.PI / 2) * 2.6,
    )

    // deliberately slack: it lags, and it never overshoots
    pos.current.lerp(want, 1 - Math.pow(0.055, dt))
    group.position.copy(pos.current)

    // it always turns to look at you
    const dx = target.x - pos.current.x
    const dz = target.z - pos.current.z
    const yaw = Math.atan2(dx, dz)
    let d = yaw - group.rotation.y
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    group.rotation.y += d * (1 - Math.pow(0.02, dt))
    // a slight tilt in the direction it is drifting reads as thrust
    group.rotation.z = THREE.MathUtils.clamp((want.x - pos.current.x) * -0.05, -0.2, 0.2)
  })

  // it reads as a companion, not a peer: noticeably smaller than the player
  return (
    <group ref={g} scale={0.62}>
      {/* shell */}
      <mesh castShadow>
        <boxGeometry args={[1.15, 1, 1]} />
        <meshStandardMaterial color="#f6f4f0" roughness={0.72} />
      </mesh>
      {/* visor */}
      <mesh position={[0, 0.12, 0.51]}>
        <boxGeometry args={[0.82, 0.4, 0.06]} />
        <meshStandardMaterial color="#2a2e35" roughness={0.45} />
      </mesh>
      {/* eyes: the only lit thing on it */}
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.14, 0.55]}>
          <boxGeometry args={[0.17, 0.17, 0.04]} />
          <meshStandardMaterial color="#3f8f83" roughness={0.35} />
        </mesh>
      ))}
      {/* thruster underneath, which is also what lights the ground below it */}
      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[0.42, 0.24, 0.42]} />
        <meshStandardMaterial color="#c8763c" roughness={0.5} />
      </mesh>
    </group>
  )
}
