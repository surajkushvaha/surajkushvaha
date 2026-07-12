import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { useReveal } from '../hooks/useReveal'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

const identities = [
  {
    kind: 'Professional',
    handle: 'surajkushvaha',
    blurb:
      'Production work — Angular, NestJS, document platforms, OCR services, published npm packages.',
    url: 'https://github.com/surajkushvaha',
  },
  {
    kind: 'Experiments',
    handle: 'thanksforfree',
    blurb:
      'The playground — AI VTubers, autonomous 3D characters, and ideas too strange for the day job.',
    url: 'https://github.com/thanksforfree',
  },
]

/** Subtle 3D tilt that follows the pointer across each card. */
function attachTilt(el: HTMLElement) {
  const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' })
  const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' })
  gsap.set(el, { transformPerspective: 900 })

  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    ry(((e.clientX - r.left) / r.width - 0.5) * 7)
    rx(-((e.clientY - r.top) / r.height - 0.5) * 7)
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
}

export default function GitHubCards() {
  const root = useReveal<HTMLElement>('.gh-card')
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (!root.current || reducedMotion) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const cards = root.current.querySelectorAll<HTMLElement>('.gh-card')
    const cleanups = Array.from(cards, attachTilt)
    return () => cleanups.forEach((fn) => fn())
  }, [root, reducedMotion])

  return (
    <section id="github" ref={root}>
      <span className="sec-num" aria-hidden="true">
        04
      </span>
      <div className="container">
        <div className="sec-head">
          <span className="idx">04</span>
          <h2 className="display">Two Identities</h2>
        </div>
        <div className="gh-grid">
          {identities.map((id) => (
            <a
              key={id.handle}
              className="gh-card"
              href={id.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="gh-kind">{id.kind}</span>
              <h3>@{id.handle}</h3>
              <p>{id.blurb}</p>
              <span className="gh-cta">view profile ↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
