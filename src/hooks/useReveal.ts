import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from './useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

/**
 * Fades/rises a section's label + title, then staggers `itemSelector`
 * children in as the section scrolls into view.
 */
export function useReveal<T extends HTMLElement>(itemSelector?: string) {
  const root = useRef<T>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    const ctx = gsap.context(() => {
      const heading = root.current!.querySelectorAll(
        '.section-label, .section-title',
      )
      if (heading.length) {
        gsap.from(heading, {
          opacity: 0,
          y: 40,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        })
      }
      if (itemSelector) {
        const items = root.current!.querySelectorAll(itemSelector)
        if (items.length) {
          gsap.from(items, {
            opacity: 0,
            y: 36,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: items[0], start: 'top 85%' },
          })
        }
      }
    }, root)
    return () => ctx.revert()
  }, [itemSelector, reducedMotion])

  return root
}

/** GSAP-driven hover lift for a card element. */
export function cardHover(el: HTMLElement, reducedMotion: boolean) {
  if (reducedMotion) return () => {}
  const lift = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' })
  const onEnter = () => lift(-6)
  const onLeave = () => lift(0)
  el.addEventListener('mouseenter', onEnter)
  el.addEventListener('mouseleave', onLeave)
  return () => {
    el.removeEventListener('mouseenter', onEnter)
    el.removeEventListener('mouseleave', onLeave)
    gsap.killTweensOf(el)
    gsap.set(el, { clearProps: 'y' })
  }
}
