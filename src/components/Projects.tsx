import { projects, ArrowIcon, type Project } from '../data/content'
import { useReveal } from '../hooks/useReveal'

function Card({ project }: { project: Project }) {
  return (
    <div className="card">
      <div className="card-top">
        <h3>{project.name}</h3>
        <span className="card-tag">{project.tag}</span>
      </div>
      <p className="desc">{project.description}</p>
      <div className="card-bottom">
        <div className="chip-row">
          {project.chips.map((c) => (
            <span className="chip" key={c}>
              {c}
            </span>
          ))}
        </div>
        {project.link ? (
          <a href={project.link} target="_blank" rel="noreferrer" className="card-link">
            {project.linkLabel} <ArrowIcon />
          </a>
        ) : (
          <span className="card-link muted">{project.status}</span>
        )}
      </div>
    </div>
  )
}

export default function Projects() {
  const root = useReveal<HTMLElement>('.card')

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
        <div className="project-grid">
          {projects.map((p) => (
            <Card key={p.name} project={p} />
          ))}
        </div>
        <p className="also-built">
          Also built: a dependency-free multi-source screen recorder (vanilla
          JS, MediaRecorder API, zero libraries), an Angular + Tauri offline
          desktop app, a Spotify-style music app with IndexedDB-based
          recommendations and no backend, a standalone Chrome extension,
          gopggo (a PG/hostel search platform), and arigato (a personal
          Angular component library).
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
