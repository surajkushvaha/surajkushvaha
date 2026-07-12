import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

/** Oversized ghost text that slides horizontally as it scrolls through view. */
export default function MarqueeStrip() {
  const root = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.marquee-track',
        { xPercent: 4 },
        {
          xPercent: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.4,
          },
        },
      )
      // kinetic: text shears with scroll velocity, settles when you stop
      const skew = gsap.quickTo('.marquee-track', 'skewX', {
        duration: 0.5,
        ease: 'power3.out',
      })
      ScrollTrigger.create({
        onUpdate: (self) => {
          skew(gsap.utils.clamp(-8, 8, self.getVelocity() / -260))
        },
      })
    }, root)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <div className="marquee-strip" ref={root} aria-hidden="true">
      <div className="marquee-track">
        Build from scratch <span className="accent">·</span> understand the
        foundations <span className="accent">·</span> build from scratch{' '}
        <span className="accent">·</span> understand the foundations
      </div>
    </div>
  )
}
