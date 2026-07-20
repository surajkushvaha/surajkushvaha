import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { experience } from '../data/content'
import { useReveal } from '../hooks/useReveal'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

export default function Experience() {
  const root = useReveal<HTMLElement>('.exp-item')
  const listRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  // accent line draws down the timeline as it scrolls through the viewport
  useLayoutEffect(() => {
    if (reducedMotion || !listRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.exp-progress',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: listRef.current,
            start: 'top 70%',
            end: 'bottom 45%',
            scrub: 0.4,
          },
        },
      )
    }, listRef)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section id="experience" ref={root}>
      <div className="container">
        <div className="section-head">
          <h2>Where I&apos;ve worked</h2>
          <p>
            One company, four roles: accessibility, document tooling, and now
            backend systems.
          </p>
        </div>
        <div className="exp-company">
          <h3>Asite</h3>
          <span>Ahmedabad, India · Feb 2023 - Present</span>
        </div>
        <div className="exp-list" ref={listRef}>
          <span className="exp-progress" aria-hidden="true" />
          {experience.map((item) => (
            <div className="exp-item" key={item.role}>
              <div className="exp-row">
                <span className="exp-role">{item.role}</span>
                <span className="exp-dates">{item.dates}</span>
              </div>
              {item.bullets && (
                <ul>
                  {item.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
              {item.note && <p>{item.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
