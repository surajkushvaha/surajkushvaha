import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PALETTE = {
  light: { ink: 0xa1a1aa, faint: 0xd4d4d8, accent: 0x7c3aed },
  dark: { ink: 0x52525b, faint: 0x3f3f46, accent: 0xa78bfa },
}

/**
 * Monoline Three.js signature piece: a wireframe icosahedron with an inner
 * core and a sparse particle drift, sitting behind the hero. Rotation is
 * driven by scroll + gentle pointer parallax; colors follow the theme.
 */
export default function HeroScene() {
  const mount = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = mount.current
    if (!host) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      40,
      host.clientWidth / host.clientHeight,
      0.1,
      50,
    )
    camera.position.set(0, 0, 7)

    const group = new THREE.Group()
    scene.add(group)

    const outerGeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.7, 1))
    const outerMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 })
    const outer = new THREE.LineSegments(outerGeo, outerMat)
    group.add(outer)

    const innerGeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.95, 0))
    const innerMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 })
    const inner = new THREE.LineSegments(innerGeo, innerMat)
    group.add(inner)

    const ringPts: THREE.Vector3[] = []
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2
      ringPts.push(new THREE.Vector3(Math.cos(a) * 2.7, 0, Math.sin(a) * 2.7))
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts)
    const ringMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.4 })
    const ring = new THREE.Line(ringGeo, ringMat)
    ring.rotation.set(Math.PI / 2.6, 0, -0.3)
    group.add(ring)

    const COUNT = 320
    const positions = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const r = 2.4 + Math.random() * 3.4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const ptsGeo = new THREE.BufferGeometry()
    ptsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const ptsMat = new THREE.PointsMaterial({
      size: 0.035,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
    })
    const points = new THREE.Points(ptsGeo, ptsMat)
    group.add(points)

    const applyTheme = () => {
      const p = document.documentElement.classList.contains('dark')
        ? PALETTE.dark
        : PALETTE.light
      outerMat.color.setHex(p.ink)
      innerMat.color.setHex(p.faint)
      ringMat.color.setHex(p.accent)
      ptsMat.color.setHex(p.ink)
    }
    applyTheme()
    const themeObserver = new MutationObserver(applyTheme)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    const pointer = { x: 0, y: 0 }
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(host)

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      const t = clock.getElapsedTime()
      const scroll = window.scrollY
      // slow idle spin + scroll-driven rotation + pointer parallax
      outer.rotation.y = t * 0.08 + scroll * 0.0016
      outer.rotation.z = t * 0.02
      inner.rotation.y = -t * 0.14 - scroll * 0.001
      inner.rotation.x = t * 0.05
      ring.rotation.z += 0.0008
      points.rotation.y = t * 0.014
      const damp = 0.045
      group.rotation.y += (pointer.x * 0.28 - group.rotation.y) * damp
      group.rotation.x += (pointer.y * 0.18 - group.rotation.x) * damp
      group.position.y = scroll * -0.0012
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      themeObserver.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', onPointer)
      outerGeo.dispose()
      innerGeo.dispose()
      ringGeo.dispose()
      ptsGeo.dispose()
      outerMat.dispose()
      innerMat.dispose()
      ringMat.dispose()
      ptsMat.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [])

  return <div className="hero-3d" ref={mount} aria-hidden="true" />
}
