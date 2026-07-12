import { stackGroups } from '../data/projects'
import { useReveal } from '../hooks/useReveal'

export default function TechStack() {
  const root = useReveal<HTMLElement>('.stack-group')

  return (
    <section id="stack" ref={root}>
      <div className="container">
        <span className="section-label">02 — Toolkit</span>
        <h2 className="section-title display">Tech Stack</h2>
        <div className="stack-groups">
          {stackGroups.map((g) => (
            <div className="stack-group" key={g.title}>
              <h3>{g.title}</h3>
              <ul>
                {g.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
