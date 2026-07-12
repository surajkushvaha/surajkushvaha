import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'
import heroImage from '../../assets/og-image.png'

export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.badge-pill', { opacity: 0, y: 16, duration: 0.6, delay: 0.1 })
        .from('.hero h1', { opacity: 0, y: 22, duration: 0.8 }, '-=0.35')
        .from('.hero .lead', { opacity: 0, y: 18, duration: 0.7 }, '-=0.5')
        .from('.hero-actions', { opacity: 0, y: 16, duration: 0.6 }, '-=0.45')
        .from('.hero-stats > div', { opacity: 0, y: 14, duration: 0.55, stagger: 0.08 }, '-=0.35')
        .from('.hero-image', { opacity: 0, x: 24, duration: 0.9 }, 0.35)
    }, root)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section className="hero" ref={root}>
      <div className="container hero-grid">
        <div className="hero-content">
          <span className="badge-pill">
            <span className="dot" />
            Open to new opportunities
          </span>
          <h1>
            Software engineer who
            <br />
            builds <span className="accent-word">past the brief.</span>
          </h1>
          <p className="lead">
            I&apos;m Suraj — I build frontend architecture and backend
            microservices in the SaaS world, and spend my spare time on the
            projects that don&apos;t fit a sprint board: AI VTubers, OCR
            pipelines, an architecture-design tool, a 2D game shipped purely
            out of spite.
          </p>
          <div className="hero-actions">
            <a href="#projects" className="btn btn-primary">
              View projects
            </a>
            <a href="#contact" className="btn btn-outline">
              Get in touch
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <div className="stat-num">3+</div>
              <div className="stat-label">Years in SaaS</div>
            </div>
            <div>
              <div className="stat-num">12+</div>
              <div className="stat-label">Side projects &amp; experiments</div>
            </div>
            <div>
              <div className="stat-num">4</div>
              <div className="stat-label">Promotions, one company</div>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <img
            src={heroImage}
            alt="Abstract line illustration connecting a wireframe avatar, a circuit, and a code bracket"
          />
        </div>
      </div>
    </section>
  )
}
