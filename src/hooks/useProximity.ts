import { useLayoutEffect, type RefObject } from 'react'
import { usePrefersReducedMotion } from './useMediaFlags'

/**
 * Type that knows where your cursor is.
 *
 * Each character lifts as the pointer nears it, and settles the instant it
 * leaves — so the headline reads as a surface with give in it rather than an
 * image of some words. The falloff is smoothstep, not linear: a linear falloff
 * makes the influence edge visible as a hard ring travelling over the text.
 *
 * Rects are cached and only re-measured on resize/scroll. Reading 40 bounding
 * boxes every frame would thrash layout for no gain — the letters do not move
 * in the document, only in their transform.
 */
export function useProximity(
  root: RefObject<HTMLElement | null>,
  selector: string,
  radius = 130,
) {
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const els = Array.from(root.current.querySelectorAll<HTMLElement>(selector))
    if (!els.length) return

    let centers: { x: number; y: number }[] = []
    const measure = () => {
      centers = els.map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      })
    }
    measure()

    let mx = -9999
    let my = -9999
    const current = new Float32Array(els.length)

    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
    }
    const onLeave = () => {
      mx = -9999
      my = -9999
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })

    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)

      for (let i = 0; i < els.length; i++) {
        const c = centers[i]
        const d = Math.hypot(mx - c.x, my - c.y)
        const t = Math.max(0, 1 - d / radius)
        const target = t * t * (3 - 2 * t) // smoothstep — no visible edge

        // ease toward the target so letters settle instead of snapping
        current[i] += (target - current[i]) * 0.18
        const f = current[i]

        if (f < 0.001) {
          els[i].style.transform = ''
          continue
        }
        els[i].style.transform = `translateY(${-f * 12}px) scale(${1 + f * 0.06})`
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
      els.forEach((el) => (el.style.transform = ''))
    }
  }, [root, selector, radius, reducedMotion])
}
