import { useLayoutEffect } from 'react'
import { projects, type Project } from '../data/projects'
import { useReveal, cardHover } from '../hooks/useReveal'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

function CardBody({ project }: { project: Project }) {
  return (
    <>
      <div className="card-top">
        <h3>{project.name}</h3>
        <span className="tag">{project.tag}</span>
      </div>
      <p>{project.description}</p>
      <span className="card-link">
        {project.linkLabel}
        {project.link ? ' ↗' : ''}
      </span>
    </>
  )
}

export default function Projects() {
  const root = useReveal<HTMLElement>('.project-card')
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (!root.current) return
    const cards = root.current.querySelectorAll<HTMLElement>('.project-card')
    const cleanups = Array.from(cards, (el) => cardHover(el, reducedMotion))
    return () => cleanups.forEach((fn) => fn())
  }, [root, reducedMotion])

  return (
    <section id="projects" ref={root}>
      <div className="container">
        <span className="section-label">01 — Work</span>
        <h2 className="section-title display">Featured Projects</h2>
        <div className="projects-grid">
          {projects.map((p) =>
            p.link ? (
              <a
                key={p.name}
                className="glass project-card"
                href={p.link}
                target="_blank"
                rel="noreferrer"
              >
                <CardBody project={p} />
              </a>
            ) : (
              <div key={p.name} className="glass project-card">
                <CardBody project={p} />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  )
}
