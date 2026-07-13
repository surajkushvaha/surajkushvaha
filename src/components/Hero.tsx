import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'
import { useMagnetic } from '../hooks/useMotionEffects'
import { useProximity } from '../hooks/useProximity'
import { figureFace, figureGesture } from '../lib/figure'

const ScrollLottie = lazy(() => import('./ScrollLottie'))

const LINE_1 = ['Software', 'engineer', 'who']
const LINE_2 = ['builds']
const ACCENT = ['past', 'the', 'brief.']

/**
 * Words are masked (`.wline` clips, `.w` slides up out of it) for the entrance,
 * and split to characters so `useProximity` has something to push against. The
 * two layers are independent: the entrance animates `.w`, the cursor animates
 * the `.ch` inside it.
 */
function Words({ words, accent = false }: { words: string[]; accent?: boolean }) {
  return (
    <>
      {words.map((w) => (
        <span key={w}>
          <span className="wline">
            <span className={`w${accent ? ' accent-word' : ''}`}>
              {[...w].map((ch, i) => (
                <span className="ch" key={`${ch}-${i}`}>
                  {ch}
                </span>
              ))}
            </span>
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
  useProximity(root, '.hero h1 .ch')

  useLayoutEffect(() => {
    if (reducedMotion) return
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
        .from('.scroll-lottie', { opacity: 0, duration: 0.8 }, '-=0.3')

      // the hero recedes as you leave it — it drifts up and dissolves rather
      // than sliding away rigidly, so the figure is revealed alone in the frame
      gsap.to('.hero-content', {
        y: -70,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom 30%',
          scrub: 0.5,
        },
      })

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
    }, root)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section className="hero" ref={root}>
      {/* the light the robot is standing in. it sits *behind* the canvas, so the
          robot is lit by it rather than washed over by it. */}
      <div className="hero-glow" aria-hidden="true" />
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
            {/* it leans in, curious about what you are about to look at */}
            <a
              href="#projects"
              className="btn btn-primary"
              onMouseEnter={() => {
                figureFace('curious')
                figureGesture('Yes')
              }}
              onMouseLeave={() => figureFace('neutral')}
            >
              View projects
            </a>
            {/* it waves, and it is pleased. you are going to say hello. */}
            <a
              href="#contact"
              className="btn btn-outline"
              onMouseEnter={() => {
                figureFace('happy')
                figureGesture('Wave')
              }}
              onMouseLeave={() => figureFace('neutral')}
            >
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
      </div>
      {!reducedMotion && (
        <Suspense fallback={null}>
          <ScrollLottie />
        </Suspense>
      )}
    </section>
  )
}
