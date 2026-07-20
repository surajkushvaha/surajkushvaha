import { projects, ArrowIcon, type Project } from '../data/content'
import { useReveal } from '../hooks/useReveal'

/**
 * An index, not a gallery.
 *
 * Twelve bordered cards in a grid is the portfolio template tell — it gives
 * every project the same weight and asks you to read all of them at once. A
 * list gives you the names at a glance and the detail only where you look.
 *
 * The interaction is the whole section: hovering a row resolves its detail and
 * recedes every other row. Attention is the mechanic. It is pure CSS, so it
 * works identically for a keyboard (`:focus-within`) and costs nothing.
 */
function Row({ project, index }: { project: Project; index: number }) {
  // lead with the live deployment when there is one, otherwise the code repo
  const href = project.demo ?? project.link
  const ctaLabel = project.demo ? 'Live' : project.linkLabel

  const detail = (
    <div className="proj-detail">
      <div className="proj-detail-inner">
        <p>{project.description}</p>
        <div className="proj-meta">
          <div className="chip-row">
            {project.chips.map((c) => (
              <span className="chip" key={c}>
                {c}
              </span>
            ))}
          </div>
          {href ? (
            <span className="proj-cta">
              {ctaLabel} <ArrowIcon />
            </span>
          ) : (
            <span className="proj-status">{project.status}</span>
          )}
        </div>
      </div>
    </div>
  )

  const head = (
    <>
      <span className="proj-idx">{String(index + 1).padStart(2, '0')}</span>
      <h3 className="proj-name">{project.name}</h3>
      <span className="proj-tag">{project.tag}</span>
    </>
  )

  // only the ones that go somewhere are links. the rest must not lie about it.
  return href ? (
    <a className="proj-row" href={href} target="_blank" rel="noreferrer">
      <span className="proj-head">{head}</span>
      {detail}
    </a>
  ) : (
    <div className="proj-row" tabIndex={0}>
      <span className="proj-head">{head}</span>
      {detail}
    </div>
  )
}

export default function Projects() {
  const root = useReveal<HTMLElement>('.proj-row')

  return (
    <section id="projects" ref={root}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">// projects</span>
          <h2>Things I&apos;ve built</h2>
          <p>
            A mix of production-shaped side projects and a few things that
            exist purely because the idea wouldn&apos;t leave me alone.
          </p>
        </div>

        <div className="proj-list">
          {projects.map((p, i) => (
            <Row key={p.name} project={p} index={i} />
          ))}
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
