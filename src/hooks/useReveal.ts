import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from './useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

/**
 * Gentle fade-up of a section's head, then staggers `itemSelector`
 * children in as they scroll into view.
 */
export function useReveal<T extends HTMLElement>(itemSelector?: string) {
  const root = useRef<T>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    const ctx = gsap.context(() => {
      const head = root.current!.querySelector('.section-head, .exp-company')
      if (head) {
        gsap.from(head, {
          opacity: 0,
          y: 14,
          duration: 0.55,
          ease: 'power2.out',
          scrollTrigger: { trigger: root.current, start: 'top 80%' },
        })
      }
      if (itemSelector) {
        const items = gsap.utils.toArray<HTMLElement>(
          root.current!.querySelectorAll(itemSelector),
        )
        ScrollTrigger.batch(items, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) =>
            gsap.from(batch, {
              opacity: 0,
              y: 14,
              duration: 0.55,
              ease: 'power2.out',
              stagger: 0.06,
            }),
        })
      }
    }, root)
    return () => ctx.revert()
  }, [itemSelector, reducedMotion])

  return root
}
