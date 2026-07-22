import { useState } from 'react'
import { useReveal } from '../hooks/useReveal'
import { useMagnetic } from '../hooks/useMotionEffects'
import { figureFace, figureGesture } from '../lib/figure'

const EMAIL = 'suraj04patel@gmail.com'

/**
 * The close. No centred box, no button row.
 *
 * The email *is* the headline — it is the one thing this section exists to
 * hand over, so it gets the largest type on the page rather than being demoted
 * to a pill. Clicking copies it, and the figure in the hero nods: the site
 * acknowledges you. That is the bookend to it noticing you on arrival.
 */
export default function Contact() {
  const root = useReveal<HTMLElement>('.contact-line')
  useMagnetic(root, '.contact-side a')
  const [copied, setCopied] = useState(false)
  // you do not "click" on a phone
  const canHover =
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
    } catch {
      return // clipboard denied — the mailto: link below still works
    }
    setCopied(true)
    figureGesture('Jump') // you took the email. it is delighted.
    figureFace('happy')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="contact" ref={root}>
      <div className="container">
        <h2 className="contact-line contact-head">
          Let&apos;s build
          <br />
          something.
        </h2>

        <button className="contact-line contact-email" onClick={copy}>
          <span className="contact-email-text">{EMAIL}</span>
          <span className="contact-copy" aria-live="polite">
            {copied ? 'Copied' : canHover ? 'Click to copy' : 'Tap to copy'}
          </span>
        </button>

        <div className="contact-line contact-side">
          <a href={`mailto:${EMAIL}`}>Email</a>
          <a
            href="https://www.linkedin.com/in/surajkushvaha"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/surajkushvaha"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
