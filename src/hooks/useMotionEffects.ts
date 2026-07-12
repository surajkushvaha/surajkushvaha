import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { usePrefersReducedMotion } from './useMediaFlags'

const finePointer = () => window.matchMedia('(pointer: fine)').matches

/** Magnetic pull toward the pointer for every `selector` element under root. */
export function useMagnetic(
  root: RefObject<HTMLElement | null>,
  selector: string,
) {
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current || !finePointer()) return
    const cleanups = Array.from(
      root.current.querySelectorAll<HTMLElement>(selector),
      (el) => {
        const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' })
        const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' })
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          x((e.clientX - (r.left + r.width / 2)) * 0.22)
          y((e.clientY - (r.top + r.height / 2)) * 0.22)
        }
        const onLeave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.45)' })
        }
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerleave', onLeave)
        return () => {
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerleave', onLeave)
          gsap.killTweensOf(el)
          gsap.set(el, { clearProps: 'transform' })
        }
      },
    )
    return () => cleanups.forEach((fn) => fn())
  }, [root, selector, reducedMotion])
}

/** Subtle pointer-follow 3D tilt for every `selector` element under root. */
export function useTilt(root: RefObject<HTMLElement | null>, selector: string) {
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current || !finePointer()) return
    const cleanups = Array.from(
      root.current.querySelectorAll<HTMLElement>(selector),
      (el) => {
        gsap.set(el, { transformPerspective: 800 })
        const rx = gsap.quickTo(el, 'rotationX', { duration: 0.45, ease: 'power3.out' })
        const ry = gsap.quickTo(el, 'rotationY', { duration: 0.45, ease: 'power3.out' })
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          ry(((e.clientX - r.left) / r.width - 0.5) * 5)
          rx(-((e.clientY - r.top) / r.height - 0.5) * 5)
        }
        const onLeave = () => {
          rx(0)
          ry(0)
        }
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerleave', onLeave)
        return () => {
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerleave', onLeave)
          gsap.killTweensOf(el)
          gsap.set(el, { clearProps: 'transform' })
        }
      },
    )
    return () => cleanups.forEach((fn) => fn())
  }, [root, selector, reducedMotion])
}
