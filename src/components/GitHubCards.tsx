import { useLayoutEffect } from 'react'
import { useReveal, cardHover } from '../hooks/useReveal'
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

export default function GitHubCards() {
  const root = useReveal<HTMLElement>('.gh-card')
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (!root.current) return
    const cards = root.current.querySelectorAll<HTMLElement>('.gh-card')
    const cleanups = Array.from(cards, (el) => cardHover(el, reducedMotion))
    return () => cleanups.forEach((fn) => fn())
  }, [root, reducedMotion])

  return (
    <section id="github" ref={root}>
      <div className="container">
        <span className="section-label">04 — GitHub</span>
        <h2 className="section-title display">Two Identities</h2>
        <div className="gh-grid">
          {identities.map((id) => (
            <a
              key={id.handle}
              className="glass gh-card"
              href={id.url}
              target="_blank"
              rel="noreferrer"
            >
              <span className="gh-kind">{id.kind}</span>
              <h3>@{id.handle}</h3>
              <p>{id.blurb}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
