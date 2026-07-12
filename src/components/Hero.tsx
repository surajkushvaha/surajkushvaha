import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { useIsMobile, usePrefersReducedMotion } from '../hooks/useMediaFlags'

const HeroScene = lazy(() => import('./HeroScene'))

export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-title .line > span', {
          yPercent: 110,
          duration: 1.1,
          stagger: 0.12,
          delay: 0.15,
        })
        .from(
          ['.hero-sub', '.hero-ethos'],
          { opacity: 0, y: 24, duration: 0.9, stagger: 0.12 },
          '-=0.55',
        )
        .from('.hero-scroll-hint', { opacity: 0, duration: 0.8 }, '-=0.3')
    }, root)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-glow" />
      {!isMobile && (
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      )}
      <div className="container hero-content">
        <h1 className="hero-title display">
          <span className="line">
            <span>Suraj</span>
          </span>
          <span className="line">
            <span className="accent">Kushvaha</span>
          </span>
        </h1>
        <p className="hero-sub">
          Software Engineer <span className="dot">·</span> Angular &amp; Systems{' '}
          <span className="dot">·</span> AI / 3D Web
        </p>
        <p className="hero-ethos">
          <em>Build from scratch to understand it</em> — I&apos;d rather write
          the thing myself than import it, just to know how it works
          underneath.
        </p>
      </div>
      <div className="hero-scroll-hint">scroll</div>
    </section>
  )
}
