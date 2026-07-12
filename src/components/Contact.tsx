import { useReveal } from '../hooks/useReveal'
import { useMagnetic } from '../hooks/useMotionEffects'

export default function Contact() {
  const root = useReveal<HTMLElement>('.contact-box')
  useMagnetic(root, '.btn')

  return (
    <section id="contact" ref={root}>
      <div className="container">
        <div className="contact-box">
          <h2>Let&apos;s build something</h2>
          <p>
            Open to new roles and interesting side projects. The fastest way
            to reach me is email.
          </p>
          <div className="contact-actions">
            <a href="mailto:suraj04patel@gmail.com" className="btn btn-primary">
              suraj04patel@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/surajkushvaha"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/surajkushvaha"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
