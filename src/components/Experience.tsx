import { experience } from '../data/content'
import { useReveal } from '../hooks/useReveal'

export default function Experience() {
  const root = useReveal<HTMLElement>('.exp-item')

  return (
    <section id="experience" ref={root}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">// experience</span>
          <h2>Where I&apos;ve worked</h2>
          <p>
            One company, four roles — accessibility, document tooling, and now
            backend systems.
          </p>
        </div>
        <div className="exp-company">
          <h3>Asite</h3>
          <span>Ahmedabad, India · Feb 2023 – Present</span>
        </div>
        {experience.map((item) => (
          <div className="exp-item" key={item.role}>
            <div className="exp-row">
              <span className="exp-role">{item.role}</span>
              <span className="exp-dates">{item.dates}</span>
            </div>
            {item.bullets && (
              <ul>
                {item.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
            {item.note && <p>{item.note}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
