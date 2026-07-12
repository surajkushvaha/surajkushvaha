import { useLayoutEffect, type RefObject } from 'react'
import { usePrefersReducedMotion } from './useMediaFlags'

/**
 * Tracks the pointer per element and exposes it as --px/--py CSS vars,
 * powering the radial spotlight that follows the cursor across cards.
 */
export function useSpotlight(
  root: RefObject<HTMLElement | null>,
  selector: string,
) {
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const cleanups = Array.from(
      root.current.querySelectorAll<HTMLElement>(selector),
      (el) => {
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          el.style.setProperty('--px', `${e.clientX - r.left}px`)
          el.style.setProperty('--py', `${e.clientY - r.top}px`)
        }
        el.addEventListener('pointermove', onMove, { passive: true })
        return () => el.removeEventListener('pointermove', onMove)
      },
    )
    return () => cleanups.forEach((fn) => fn())
  }, [root, selector, reducedMotion])
}
