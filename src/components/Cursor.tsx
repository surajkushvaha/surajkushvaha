import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    setEnabled(window.matchMedia('(pointer: fine)').matches)
  }, [])

  useLayoutEffect(() => {
    if (!enabled || reducedMotion || !dot.current || !ring.current) return

    const dotX = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power2.out' })
    const dotY = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power2.out' })
    const ringX = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3.out' })

    const onMove = (e: PointerEvent) => {
      dot.current!.style.opacity = '1'
      ring.current!.style.opacity = '1'
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
      const interactive = (e.target as Element | null)?.closest(
        'a, button, .proj-row, .gh-card',
      )
      ring.current?.classList.toggle('is-hover', !!interactive)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.killTweensOf([dot.current, ring.current])
    }
  }, [enabled, reducedMotion])

  if (!enabled || reducedMotion) return null

  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden="true" style={{ opacity: 0 }} />
      <div className="cursor-dot" ref={dot} aria-hidden="true" style={{ opacity: 0 }} />
    </>
  )
}
