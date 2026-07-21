import { projects, ArrowIcon, type Project } from '../data/content'
import { useReveal } from '../hooks/useReveal'

/**
 * Hierarchy, not a flat list. The first four are the strongest signals, so
 * they get real estate: name, a line of substance, stack, and a link, all
 * visible at rest. Everything else is a quiet index below. A logging library
 * should never read as loud as the flagship platform.
 */
const FEATURED_COUNT = 4

function Featured({ project }: { project: Project }) {
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

function MoreItem({ project }: { project: Project }) {
  const href = project.demo ?? project.link
  const body = (
    <>
      <span className="pm-name">{project.name}</span>
      <span className="pm-tag">{project.tag}</span>
    </>
  )
  return href ? (
    <a className="pm-row" href={href} target="_blank" rel="noreferrer">
      {body}
      <ArrowIcon />
    </a>
  ) : (
    <div className="pm-row is-static">
      {body}
    </div>
  )
}

export default function Projects() {
  const root = useReveal<HTMLElement>('.feat, .pm-row')
  const featured = projects.slice(0, FEATURED_COUNT)
  const more = projects.slice(FEATURED_COUNT)

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

        <div className="proj-more">
          <h3 className="proj-more-label">More work</h3>
          <div className="pm-list">
            {more.map((p) => (
              <MoreItem key={p.name} project={p} />
            ))}
          </div>
        </div>

        <p className="also-built">
          Also built: an agent framework with Obsidian-based memory, a
          second-iteration VRM VTuber (jessica-v2), a browser game prototype
          (gamepoc), a dependency-free multi-source screen recorder (vanilla
          JS, MediaRecorder API, zero libraries), an Angular + Tauri offline
          desktop app, a Spotify-style music app with IndexedDB-based
          recommendations and no backend, gopggo (a PG/hostel search
          platform), and arigato (a personal Angular component library).
        </p>
        <a
          href="https://github.com/surajkushvaha"
          target="_blank"
          rel="noreferrer"
          className="more-link"
        >
          More on GitHub <ArrowIcon />
        </a>
      </div>
    </section>
  )
}
