import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { useReveal } from '../hooks/useReveal'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

/** Magnetic pull — the element leans toward the pointer, springs back on leave. */
function attachMagnet(el: HTMLElement) {
  const x = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' })
  const y = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' })

  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    x((e.clientX - (r.left + r.width / 2)) * 0.25)
    y((e.clientY - (r.top + r.height / 2)) * 0.25)
  }
  const onLeave = () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
  }
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerleave', onLeave)
  return () => {
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerleave', onLeave)
    gsap.killTweensOf(el)
    gsap.set(el, { clearProps: 'transform' })
  }
}

export default function Connect() {
  const root = useReveal<HTMLElement>('.connect-mail, .connect-socials a')
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (!root.current || reducedMotion) return
    if (!window.matchMedia('(pointer: fine)').matches) return
    const targets = root.current.querySelectorAll<HTMLElement>(
      '.connect-socials a',
    )
    const cleanups = Array.from(targets, attachMagnet)
    return () => cleanups.forEach((fn) => fn())
  }, [root, reducedMotion])

  return (
    <section id="connect" className="connect" ref={root}>
      <span className="sec-num" aria-hidden="true">
        05
      </span>
      <div className="container">
        <h2 className="big display">
          <span className="solid">Let&apos;s</span>
          <span className="hollow outline">Talk</span>
        </h2>
        <a className="connect-mail" href="mailto:suraj04patel@gmail.com">
          suraj04patel@gmail.com
        </a>
        <div className="connect-socials">
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
