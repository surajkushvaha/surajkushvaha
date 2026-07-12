import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'
import { useMagnetic } from '../hooks/useMotionEffects'
import heroImage from '../../assets/og-image.png'

const ScrollLottie = lazy(() => import('./ScrollLottie'))

const LINE_1 = ['Software', 'engineer', 'who']
const LINE_2 = ['builds']
const ACCENT = ['past', 'the', 'brief.']

function Words({ words, accent = false }: { words: string[]; accent?: boolean }) {
  return (
    <>
      {words.map((w) => (
        <span key={w}>
          <span className="wline">
            <span className={`w${accent ? ' accent-word' : ''}`}>{w}</span>
          </span>{' '}
        </span>
      ))}
    </>
  )
}

export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  useMagnetic(root, '.btn')

  useLayoutEffect(() => {
    if (reducedMotion) return
    let removePointer = () => {}
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.badge-pill', { opacity: 0, y: 16, duration: 0.6, delay: 0.1 })
        .from(
          '.hero h1 .w',
          { yPercent: 110, duration: 0.9, stagger: 0.055, ease: 'power4.out' },
          '-=0.3',
        )
        .from('.hero .lead', { opacity: 0, y: 18, duration: 0.7 }, '-=0.55')
        .from('.hero-actions', { opacity: 0, y: 16, duration: 0.6 }, '-=0.45')
        .from(
          '.hero-stats > div',
          { opacity: 0, y: 14, duration: 0.55, stagger: 0.08 },
          '-=0.35',
        )
        .from(
          '.hero-image',
          { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'power4.inOut' },
          0.4,
        )
        .from('.scroll-lottie', { opacity: 0, duration: 0.8 }, '-=0.3')

      // stat numbers count up as they appear
      gsap.utils.toArray<HTMLElement>('.stat-num').forEach((el) => {
        const target = Number(el.dataset.value)
        const suffix = el.dataset.suffix ?? ''
        const counter = { v: 0 }
        gsap.to(counter, {
          v: target,
          duration: 1.4,
          delay: 0.9,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = Math.round(counter.v) + suffix
          },
        })
      })

      // illustration: slow ambient float + gentle pointer parallax
      gsap.to('.hero-image img', {
        y: -10,
        duration: 3.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      })
      if (window.matchMedia('(pointer: fine)').matches) {
        const px = gsap.quickTo('.hero-image', 'x', { duration: 0.8, ease: 'power3.out' })
        const py = gsap.quickTo('.hero-image', 'y', { duration: 0.8, ease: 'power3.out' })
        const onMove = (e: PointerEvent) => {
          px((e.clientX / window.innerWidth - 0.5) * 18)
          py((e.clientY / window.innerHeight - 0.5) * 12)
        }
        window.addEventListener('pointermove', onMove, { passive: true })
        removePointer = () => window.removeEventListener('pointermove', onMove)
      }
    }, root)
    return () => {
      removePointer()
      ctx.revert()
    }
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
            <Words words={LINE_1} />
            <br />
            <Words words={LINE_2} /> <Words words={ACCENT} accent />
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
              <div className="stat-num" data-value="3" data-suffix="+">
                3+
              </div>
              <div className="stat-label">Years in SaaS</div>
            </div>
            <div>
              <div className="stat-num" data-value="12" data-suffix="+">
                12+
              </div>
              <div className="stat-label">Side projects &amp; experiments</div>
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
      {!reducedMotion && (
        <Suspense fallback={null}>
          <ScrollLottie />
        </Suspense>
      )}
    </section>
  )
}
