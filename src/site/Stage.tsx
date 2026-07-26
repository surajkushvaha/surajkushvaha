import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAmbient } from './useAmbient'
import '../styles/stage.css'

/**
 * The landing, built against the eight references Suraj sent.
 *
 * The rules they share, and which the old hero broke every one of:
 *   - one signature scene, full bleed, no reading container   (growon, igloo)
 *   - display-scale type composed over the geometry           (abeto, hatom)
 *   - chrome is three or four small floating things           (all of them)
 *   - sound first class, off by default                       (hatom, igloo)
 *   - scroll drives the CAMERA, not just the document         (igloo, haunted)
 *   - the character reacts to being touched                   (talking tom)
 *   - "avoid a menu with multiple pages"                      (vev best practice)
 *
 * The scroll section is deliberately taller than the viewport with the canvas
 * pinned inside it. That is what makes scrolling move the camera instead of
 * moving the page: for the first couple of screens you are flying in toward the
 * island, and only then does the written part begin. `progress` is a ref, not
 * state, so sixty scroll events a second never re-render the tree; only the
 * three text beats are React state, and those change twice.
 *
 * The canvas is lazy and never blocking. The wordmark, headline and links are
 * real DOM and paint immediately, so this is legible and navigable before any
 * WebGL exists and stays that way if the scene never loads at all.
 */

const Scene = lazy(() => import('./StageScene'))

/** how many viewports the pinned scroll section occupies */
const SCROLL_VH = 2.8

const BEATS = [
  {
    eyebrow: 'Software engineer · Ahmedabad',
    title: ['Builds past', 'the brief.'],
    sub: 'Angular and Rust by day. AI avatars, OCR pipelines and motion-capture research the rest of the time.',
  },
  {
    eyebrow: 'The island',
    title: ['Everything here', 'was built by it.'],
    sub: 'The place you are looking at was extruded by ProjectArch, one of the projects it is showing you. The medium is the evidence.',
  },
  {
    eyebrow: 'Two ways in',
    title: ['Walk it,', 'or read it.'],
    sub: 'Take the island on foot with the robot, or keep scrolling for the written version.',
  },
]

export default function Stage() {
  const { on: sound, toggle: toggleSound, blip } = useAmbient()
  const [ready, setReady] = useState(false)
  const [beat, setBeat] = useState(0)
  const [line, setLine] = useState<string | null>(null)
  const progress = useRef(0)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 60)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const el = wrap.current
      if (!el) return
      // distance available for the pin, i.e. the section height minus one screen
      const span = el.offsetHeight - window.innerHeight
      const p = span > 0 ? Math.min(Math.max(-el.getBoundingClientRect().top / span, 0), 1) : 0
      progress.current = p
      // two thresholds, so this sets state at most twice on the way down
      const b = p < 0.34 ? 0 : p < 0.72 ? 1 : 2
      setBeat((was) => (was === b ? was : b))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const say = useMemo(
    () => (text: string | null) => {
      setLine(text)
      if (text) blip(text.length % 3)
    },
    [blip],
  )

  const b = BEATS[beat]

  return (
    <div className="st" ref={wrap} style={{ height: `${SCROLL_VH * 100}svh` }}>
      <div className={`st-pin${ready ? ' st-ready' : ''}`}>
        <div className="st-scene">
          <Suspense fallback={null}>
            <Scene progress={progress} onSay={say} />
          </Suspense>
        </div>

        {/* the radial vignette that gives the scene depth, straight off growon */}
        <div className="st-vignette" aria-hidden="true" />

        {/* ---------- chrome: three things ---------- */}
        <a href="#about" className="st-mark mono">
          Suraj&nbsp;Kushvaha
        </a>

        <button className="st-sound mono" onClick={toggleSound} aria-pressed={sound}>
          Sound&nbsp;{sound ? 'on' : 'off'}
        </button>

        {/* ---------- the type, keyed so each beat animates in ---------- */}
        <div className="st-type">
          <div className="st-beat" key={beat}>
            <p className="st-eyebrow mono">{b.eyebrow}</p>
            <h1 className="st-title">
              {b.title.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </h1>
            <p className="st-sub">{b.sub}</p>
            {beat === 2 && (
              <div className="st-actions">
                <Link to="/world" className="st-enter mono">
                  Walk the island
                  <span aria-hidden="true">→</span>
                </Link>
                <a href="#about" className="st-read mono">
                  Read instead
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ---------- what the robot says when poked ---------- */}
        <div className={`st-say${line ? ' on' : ''}`} role="status" aria-live="polite">
          {line}
        </div>

        {/* nobody pokes something they were not told to poke */}
        <p className="st-hint mono">Poke him</p>

        <div className="st-cue mono">
          <span>Scroll</span>
          <span className="st-cue-line" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
