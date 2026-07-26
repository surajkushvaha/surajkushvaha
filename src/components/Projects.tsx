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

/**
 * The home preview, set as an editorial index rather than a card grid.
 *
 * Four identical bordered cards is the single most templated shape in this
 * genre, and it flattens the work: a two-year platform and a weekend
 * experiment get the same box, the same weight and the same amount of the
 * reader's attention. Set as full-width rows the project NAME carries the
 * section at display size, the detail stays out of the way until wanted, and
 * the eye runs down a list instead of bouncing around a grid.
 *
 * Deliberately not numbered. Numbering implies a sequence, and these are
 * parallel pieces of work, not steps - a rank would be a claim the content
 * does not make.
 *
 * `Featured` above is untouched: the /work page still uses it, where a grid of
 * every project genuinely is the right shape.
 */
function ProjectRow({ project }: { project: Project }) {
  const href = project.demo ?? project.link
  const cta = project.demo ? 'Live' : project.linkLabel

  const inner = (
    <>
      <div className="pr-head">
        <h3 className="pr-name">{project.name}</h3>
        <span className="pr-tag mono">{project.tag}</span>
      </div>
      <div className="pr-body">
        <p className="pr-desc">{project.description}</p>
        <div className="pr-foot">
          <div className="chip-row">
            {project.chips.map((c) => (
              <span className="chip" key={c}>
                {c}
              </span>
            ))}
          </div>
          <span className="pr-cta mono">
            {href ? (
              <>
                {cta} <ArrowIcon />
              </>
            ) : (
              project.status
            )}
          </span>
        </div>
      </div>
    </>
  )

  return href ? (
    <a className="pr-row" href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <div className="pr-row" tabIndex={0}>
      {inner}
    </div>
  )
}

export default function Projects() {
  const root = useReveal<HTMLElement>('.pr-row')
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

        <div className="pr-list">
          {featured.map((p) => (
            <ProjectRow key={p.name} project={p} />
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
