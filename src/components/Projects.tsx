import { Link } from 'react-router-dom'
import { projects, ArrowIcon, type Project } from '../data/content'
import { useReveal } from '../hooks/useReveal'

const FEATURED_COUNT = 4

/** A substantial project block: name, a line of substance, stack, and a link,
 *  all visible at rest. Shared between the home preview and the /work page. */
export function Featured({ project }: { project: Project }) {
  const href = project.demo ?? project.link
  const cta = project.demo ? 'Live' : project.linkLabel

  const inner = (
    <>
      <div className="feat-top">
        <h3 className="feat-name">{project.name}</h3>
        <span className="feat-tag">{project.tag}</span>
      </div>
      <p className="feat-desc">{project.description}</p>
      <div className="feat-meta">
        <div className="chip-row">
          {project.chips.map((c) => (
            <span className="chip" key={c}>
              {c}
            </span>
          ))}
        </div>
        {href ? (
          <span className="feat-cta">
            {cta} <ArrowIcon />
          </span>
        ) : (
          <span className="proj-status">{project.status}</span>
        )}
      </div>
    </>
  )

  return href ? (
    <a className="feat" href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <div className="feat" tabIndex={0}>
      {inner}
    </div>
  )
}

export default function Projects() {
  const root = useReveal<HTMLElement>('.feat')
  const featured = projects.slice(0, FEATURED_COUNT)

  return (
    <section id="projects" ref={root}>
      <div className="container">
        <div className="section-head">
          <h2>Things I&apos;ve built</h2>
          <p>
            A mix of production-shaped side projects and a few things that
            exist purely because the idea wouldn&apos;t leave me alone.
          </p>
        </div>

        <div className="feat-grid">
          {featured.map((p) => (
            <Featured key={p.name} project={p} />
          ))}
        </div>

        <Link to="/work" className="view-all">
          View all projects
          <span className="va-count">({projects.length})</span>
          <ArrowIcon />
        </Link>
      </div>
    </section>
  )
}
