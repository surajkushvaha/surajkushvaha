import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

const ACCENT = new THREE.Color('#a78bfa')
const ACCENT_DEEP = new THREE.Color('#7c3aed')
const PARTICLE_COUNT = 1200

function ParticleShell() {
  const ref = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // random points on a fuzzy sphere shell around the icosahedron
      const r = 2.2 + Math.random() * 2.4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      const c = ACCENT.clone().lerp(ACCENT_DEEP, Math.random())
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.02
    ref.current.rotation.x += delta * 0.008
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function WireIcosahedron() {
  const ref = useRef<THREE.LineSegments>(null)

  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.5, 1)),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.1
    ref.current.rotation.z += delta * 0.03
    // slow breathing
    const s = 1 + Math.sin(clock.elapsedTime * 0.4) * 0.03
    ref.current.scale.setScalar(s)
  })

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color={ACCENT} transparent opacity={0.45} />
    </lineSegments>
  )
}

function ParallaxRig() {
  const group = useRef<THREE.Group>(null)
  const target = useRef({ x: 0, y: 0 })
  const { size } = useThree()

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / size.width - 0.5) * 2
      target.current.y = (e.clientY / size.height - 0.5) * 2
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [size.width, size.height])

  useFrame((_, delta) => {
    if (!group.current) return
    const damp = 1 - Math.exp(-delta * 2.5)
    group.current.rotation.y +=
      (target.current.x * 0.18 - group.current.rotation.y) * damp
    group.current.rotation.x +=
      (target.current.y * 0.12 - group.current.rotation.x) * damp
  })

  return (
    <group ref={group}>
      <WireIcosahedron />
      <ParticleShell />
    </group>
  )
}

function StaticScene() {
  return (
    <group rotation={[0.3, 0.6, 0]}>
      <WireIcosahedron />
      <ParticleShell />
    </group>
  )
}

export default function HeroScene() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="hero-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        camera={{ position: [1.6, 0.2, 6], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {reducedMotion ? <StaticScene /> : <ParallaxRig />}
      </Canvas>
    </div>
  )
}
