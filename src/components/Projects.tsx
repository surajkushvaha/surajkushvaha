import { projects, type Project } from '../data/projects'
import { useReveal } from '../hooks/useReveal'

function Row({ project, index }: { project: Project; index: number }) {
  const num = String(index + 1).padStart(2, '0')
  const content = (
    <>
      <div className="fill" />
      <span className="num">{num}</span>
      <div className="mid">
        <span className="name display">{project.name}</span>
        <p className="desc">{project.description}</p>
      </div>
      <div className="side">
        <span className="tag">{project.tag}</span>
        {project.link ? (
          <span className="arrow">↗</span>
        ) : (
          <span className="lock">private · in dev</span>
        )}
      </div>
    </>
  )

  return project.link ? (
    <a
      className="proj-row"
      href={project.link}
      target="_blank"
      rel="noreferrer"
    >
      {content}
    </a>
  ) : (
    <div className="proj-row private">{content}</div>
  )
}

export default function Projects() {
  const root = useReveal<HTMLElement>('.proj-row')

  return (
    <section id="projects" ref={root}>
      <span className="sec-num" aria-hidden="true">
        01
      </span>
      <div className="container">
        <div className="sec-head">
          <span className="idx">01</span>
          <h2 className="display">Selected Work</h2>
        </div>
        <div className="proj-list">
          {projects.map((p, i) => (
            <Row key={p.name} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
