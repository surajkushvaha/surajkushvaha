import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

const STATEMENT: { text: string; accent?: boolean }[] = [
  { text: 'By day I ship production Angular frontends and backend microservices.' },
  { text: 'By night — AI VTubers, OCR pipelines, architecture tools, the occasional rage-game.' },
  { text: 'The thread through all of it:', accent: false },
  { text: "I'd rather build it from scratch than import it,", accent: true },
  { text: 'just to know how it works underneath.' },
]

export default function About() {
  const root = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    const ctx = gsap.context(() => {
      gsap.from('.sec-head', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 75%' },
      })
      // words brighten one by one as the statement scrolls through the viewport
      gsap.to('.about-statement .w', {
        opacity: 1,
        stagger: 0.03,
        ease: 'none',
        scrollTrigger: {
          trigger: '.about-statement',
          start: 'top 78%',
          end: 'bottom 45%',
          scrub: 0.5,
        },
      })
      gsap.from('.about-current span', {
        opacity: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.07,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-current', start: 'top 88%' },
      })
    }, root)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section id="about" ref={root}>
      <span className="sec-num" aria-hidden="true">
        03
      </span>
      <div className="container">
        <div className="sec-head">
          <span className="idx">03</span>
          <h2 className="display">Ethos</h2>
        </div>
        <p className="about-statement">
          {STATEMENT.map((chunk, ci) =>
            chunk.text.split(' ').map((word, wi) => (
              <span
                key={`${ci}-${wi}`}
                className={`w${chunk.accent ? ' accent' : ''}`}
              >
                {word}{' '}
              </span>
            )),
          )}
        </p>
        <div className="about-current">
          <span>Now — building ProjectArch</span>
          <span>building Jessica</span>
          <span>learning Rust</span>
          <span>maintaining colored-beautiful-logger</span>
        </div>
      </div>
    </section>
  )
}
