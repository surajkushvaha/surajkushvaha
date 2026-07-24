import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from './useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

/**
 * Reveals a section's head, then staggers `itemSelector` children in as they
 * scroll into view.
 *
 * The distance is the point. A 14px fade is an apology — the eye reads it as
 * "something loaded late", not as arrival. 40px on a long, decelerating ease
 * reads as the content *travelling* to its place, which is what makes it feel
 * authored rather than rendered.
 */
export function useReveal<T extends HTMLElement>(itemSelector?: string) {
  const root = useRef<T>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    const ctx = gsap.context(() => {
      const head = root.current!.querySelector(
        '.section-head, .exp-company, .about-col',
      )
      if (head) {
        gsap.from(head, {
          opacity: 0,
          y: 40,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: root.current, start: 'top 85%' },
        })
      }
      if (itemSelector) {
        // About passes '.about-col', which also matches the head element above.
        // Two competing `from` tweens on one node leave it stuck at opacity 0
        // (this is what made the About heading invisible), so the head never
        // gets to be a batch item as well.
        const items = gsap.utils
          .toArray<HTMLElement>(root.current!.querySelectorAll(itemSelector))
          .filter((el) => el !== head)
        ScrollTrigger.batch(items, {
          start: 'top 90%',
          once: true,
          onEnter: (batch) =>
            gsap.from(batch, {
              opacity: 0,
              y: 44,
              duration: 1,
              ease: 'power3.out',
              stagger: 0.09,
            }),
        })
      }
    }, root)
    return () => ctx.revert()
  }, [itemSelector, reducedMotion])

  return root
}
