import { useReveal } from '../hooks/useReveal'

export default function About() {
  const root = useReveal<HTMLElement>('.about-inner p')

  return (
    <section id="about" ref={root}>
      <div className="container">
        <span className="section-label">03 — Ethos</span>
        <h2 className="section-title display">Build From Scratch</h2>
        <div className="about-inner">
          <p>
            By day I build <strong>production Angular frontends</strong> and{' '}
            <strong>backend microservices</strong>. By night I chase the
            weirder ideas — AI VTubers, OCR pipelines, architecture-design
            tools, the occasional rage-game.
          </p>
          <p>
            The thread through all of it:{' '}
            <span className="accent">
              I&apos;d rather build something from scratch than reach for a
              library
            </span>
            , just to understand how it works underneath. Loggers, OCR engines,
            3D animation systems — if it interests me, I want to know its
            internals.
          </p>
          <p>
            Currently building <strong>ProjectArch</strong> and{' '}
            <strong>Jessica</strong>, learning <strong>Rust</strong>, and
            keeping <strong>colored-beautiful-logger</strong> alive on npm.
          </p>
        </div>
      </div>
    </section>
  )
}
