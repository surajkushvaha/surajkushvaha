import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Marquee from './Marquee'
import { useIsMobile, usePrefersReducedMotion } from '../hooks/useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

const HeroScene = lazy(() => import('./HeroScene'))

interface Props {
  ready: boolean
}

export default function Hero({ ready }: Props) {
  const root = useRef<HTMLElement>(null)
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !ready) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .from('.hero-name .row > span', {
          yPercent: 115,
          duration: 1.3,
          stagger: 0.14,
        })
        .from(
          '.hero-canvas',
          { opacity: 0, scale: 1.06, duration: 1.6, ease: 'power2.out' },
          '<0.2',
        )
        .from(
          ['.hero-role', '.hero-ethos'],
          { opacity: 0, y: 26, duration: 0.9, stagger: 0.1 },
          '-=0.9',
        )
        .from('.hero-marquee', { opacity: 0, duration: 0.9 }, '-=0.5')

      // scene drifts up + fades as the hero scrolls away
      gsap.to(['.hero-canvas', '.hero-glow'], {
        opacity: 0,
        y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'center center',
          end: 'bottom top',
          scrub: true,
        },
      })
      // the two name rows shear apart slightly on scroll
      gsap.to('.hero-name .row-first', {
        xPercent: -6,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
      gsap.to('.hero-name .row-last', {
        xPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, root)
    return () => ctx.revert()
  }, [reducedMotion, ready])

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-glow" />
      {!isMobile && (
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      )}
      <h1 className="hero-name display" style={{ zIndex: 2 }}>
        <span className="row row-first">
          <span>Suraj</span>
        </span>
        <span className="row row-last">
          <span className="outline-accent">Kushvaha</span>
        </span>
      </h1>
      <div className="hero-meta">
        <p className="hero-role">
          Software Engineer <span className="dot">·</span> Angular &amp;
          Systems <span className="dot">·</span> AI / 3D Web
        </p>
        <p className="hero-ethos">
          <em>Build from scratch to understand it</em> — I&apos;d rather write
          the thing myself than import it.
        </p>
      </div>
      <Marquee
        className="hero-marquee"
        items={['Angular', 'Systems', 'AI VTubers', '3D Web', 'Rust', 'OCR']}
        ghost
        speed={36}
      />
    </section>
  )
}
