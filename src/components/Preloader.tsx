import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

interface Props {
  onDone: () => void
}

export default function Preloader({ onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const done = useRef(onDone)
  done.current = onDone

  useLayoutEffect(() => {
    if (reducedMotion) {
      done.current()
      return
    }
    const ctx = gsap.context(() => {
      const counter = { v: 0 }
      const el = root.current!.querySelector('.pre-count')!
      gsap
        .timeline()
        .from('.pre-name', { yPercent: 120, duration: 0.7, ease: 'power3.out' })
        .to(
          counter,
          {
            v: 100,
            duration: 1.1,
            ease: 'power2.inOut',
            onUpdate: () => {
              el.textContent = String(Math.round(counter.v)).padStart(3, '0')
            },
          },
          '<',
        )
        // hero intro starts as the curtain lifts, not after
        .add(() => done.current(), '+=0.15')
        .to(root.current, {
          yPercent: -100,
          duration: 0.8,
          ease: 'power4.inOut',
        })
    }, root)
    return () => ctx.revert()
  }, [reducedMotion])

  if (reducedMotion) return null

  return (
    <div className="preloader" ref={root} aria-hidden="true">
      <div className="preloader-inner">
        <div style={{ overflow: 'hidden' }}>
          <div className="pre-name display">Suraj Kushvaha</div>
        </div>
        <div className="pre-count">000</div>
      </div>
    </div>
  )
}
