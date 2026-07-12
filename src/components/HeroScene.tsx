import { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

const ACCENT = new THREE.Color('#a78bfa')
const ACCENT_DEEP = new THREE.Color('#7c3aed')
const WHITE = new THREE.Color('#f2f0ee')
const PARTICLE_COUNT = 1500

function ParticleShell() {
  const ref = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 2.1 + Math.pow(Math.random(), 0.7) * 3.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
      const c =
        Math.random() > 0.85
          ? WHITE.clone()
          : ACCENT.clone().lerp(ACCENT_DEEP, Math.random())
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
    ref.current.rotation.y += delta * 0.018
    ref.current.rotation.x += delta * 0.006
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.022}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function WireIcosahedron() {
  const outer = useRef<THREE.LineSegments>(null)
  const inner = useRef<THREE.LineSegments>(null)

  const outerGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.5, 1)),
    [],
  )
  const innerGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.85, 0)),
    [],
  )

  useEffect(
    () => () => {
      outerGeo.dispose()
      innerGeo.dispose()
    },
    [outerGeo, innerGeo],
  )

  useFrame(({ clock }, delta) => {
    if (outer.current) {
      outer.current.rotation.y += delta * 0.1
      outer.current.rotation.z += delta * 0.025
      const s = 1 + Math.sin(clock.elapsedTime * 0.35) * 0.03
      outer.current.scale.setScalar(s)
    }
    if (inner.current) {
      inner.current.rotation.y -= delta * 0.16
      inner.current.rotation.x += delta * 0.05
    }
  })

  return (
    <>
      <lineSegments ref={outer} geometry={outerGeo}>
        <lineBasicMaterial color={ACCENT} transparent opacity={0.5} />
      </lineSegments>
      <lineSegments ref={inner} geometry={innerGeo}>
        <lineBasicMaterial color={WHITE} transparent opacity={0.16} />
      </lineSegments>
    </>
  )
}

/** Thin tilted orbit ring of points around the icosahedron. */
function OrbitRing() {
  const ref = useRef<THREE.LineLoop>(null)

  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * 2.55, 0, Math.sin(a) * 2.55))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.12
  })

  return (
    <group rotation={[Math.PI / 3.2, 0, -0.35]}>
      <lineLoop ref={ref} geometry={geometry}>
        <lineBasicMaterial color={ACCENT_DEEP} transparent opacity={0.35} />
      </lineLoop>
    </group>
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
      (target.current.x * 0.22 - group.current.rotation.y) * damp
    group.current.rotation.x +=
      (target.current.y * 0.14 - group.current.rotation.x) * damp
  })

  return (
    <group ref={group}>
      <WireIcosahedron />
      <OrbitRing />
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
        camera={{ position: [1.9, 0.15, 6.2], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {reducedMotion ? (
          <group rotation={[0.3, 0.6, 0]}>
            <WireIcosahedron />
            <OrbitRing />
            <ParticleShell />
          </group>
        ) : (
          <ParallaxRig />
        )}
      </Canvas>
    </div>
  )
}
