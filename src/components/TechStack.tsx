import Marquee from './Marquee'
import { stackGroups } from '../data/projects'
import { useReveal } from '../hooks/useReveal'

export default function TechStack() {
  const root = useReveal<HTMLElement>('.stack-group')

  return (
    <section id="stack" ref={root}>
      <span className="sec-num" aria-hidden="true">
        02
      </span>
      <div className="container">
        <div className="sec-head">
          <span className="idx">02</span>
          <h2 className="display">Toolkit</h2>
        </div>
      </div>
      <div className="stack-marquees">
        <Marquee
          items={['TypeScript', 'Angular', 'Three.js', 'NestJS', 'Rust']}
          speed={44}
        />
        <Marquee
          items={['PostgreSQL', 'Kafka', 'Redis', 'Docker', 'Python']}
          ghost
          reverse
          speed={52}
        />
      </div>
      <div className="container">
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
