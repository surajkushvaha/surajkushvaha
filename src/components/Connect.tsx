import { useReveal } from '../hooks/useReveal'

export default function Connect() {
  const root = useReveal<HTMLElement>('.connect-links a')

  return (
    <section id="connect" className="connect" ref={root}>
      <div className="container">
        <span className="section-label">05 — Connect</span>
        <h2 className="section-title display">Let&apos;s Talk</h2>
        <div className="connect-links">
          <a href="mailto:suraj04patel@gmail.com">suraj04patel@gmail.com</a>
          <a
            href="https://www.linkedin.com/in/surajkushvaha"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  )
}
