import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from './useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

/**
 * Fades/rises a section's heading, then staggers `itemSelector`
 * children in as the section scrolls into view.
 */
export function useReveal<T extends HTMLElement>(itemSelector?: string) {
  const root = useRef<T>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    const ctx = gsap.context(() => {
      const heading = root.current!.querySelector('.sec-head')
      if (heading) {
        gsap.from(heading, {
          opacity: 0,
          y: 44,
          duration: 0.95,
          ease: 'power3.out',
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        })
      }
      if (itemSelector) {
        const items = root.current!.querySelectorAll(itemSelector)
        if (items.length) {
          gsap.from(items, {
            opacity: 0,
            y: 42,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.09,
            scrollTrigger: { trigger: items[0], start: 'top 88%' },
          })
        }
      }
    }, root)
    return () => ctx.revert()
  }, [itemSelector, reducedMotion])

  return root
}
