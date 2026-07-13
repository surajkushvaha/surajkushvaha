import { useLayoutEffect, useRef } from 'react'
import { useIsMobile, usePrefersReducedMotion } from '../hooks/useMediaFlags'

/**
 * Two marks, and the distance between them is the whole idea.
 *
 * The dot is exactly where you are — never smoothed, because a pointer that
 * lags is a broken pointer. The ring trails it and swells over anything you can
 * act on. It is the ring that carries the feel: the page acknowledges your
 * intent slightly *before* you commit to it.
 *
 * Never on touch (there is no cursor to augment) and never under reduced
 * motion, where the native cursor is left alone entirely.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobile()

  useLayoutEffect(() => {
    if (reducedMotion || isMobile) return
    const d = dot.current
    const r = ring.current
    if (!d || !r) return

    document.body.classList.add('has-cursor')

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let hot = 0 // 0 = idle, 1 = over something actionable
    let hotTarget = 0
    let down = 0

    const INTERACTIVE = 'a, button, .proj-row, [role="button"], input'

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      // the target is not always an Element (window and document both fire here),
      // and `closest` only exists on Elements
      const t = e.target
      hotTarget = t instanceof Element && t.closest(INTERACTIVE) ? 1 : 0
    }
    const onDown = () => (down = 1)
    const onUp = () => (down = 0)
    const onLeave = () => (hotTarget = 0)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)

      // the ring chases; the dot does not. exponential, framerate-independent.
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      hot += (hotTarget - hot) * 0.14

      const scale = 1 + hot * 1.1 - down * 0.25

      d.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${1 - hot * 0.6})`
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`
      r.style.opacity = String(0.35 + hot * 0.45)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      document.body.classList.remove('has-cursor')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [reducedMotion, isMobile])

  if (reducedMotion || isMobile) return null

  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
    </>
  )
}
