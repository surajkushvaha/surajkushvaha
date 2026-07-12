import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../hooks/useMediaFlags'

gsap.registerPlugin(ScrollTrigger)

/**
 * Monoline divider artwork in the style of the hero illustration —
 * a signal line flowing through circuit nodes into a wireframe polyhedron.
 * Strokes use currentColor so it adapts to light/dark, and each path
 * draws itself in as it scrolls into view.
 */
export default function LineArt({ flip = false }: { flip?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useLayoutEffect(() => {
    if (reducedMotion || !root.current) return
    const ctx = gsap.context(() => {
      const paths = root.current!.querySelectorAll<SVGPathElement>('path, polyline')
      paths.forEach((path) => {
        const len = (path as SVGGeometryElement).getTotalLength()
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
      })
      gsap.to(paths, {
        strokeDashoffset: 0,
        ease: 'none',
        stagger: 0.15,
        scrollTrigger: {
          trigger: root.current,
          start: 'top 92%',
          end: 'top 40%',
          scrub: 0.6,
        },
      })
    }, root)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <div
      className={`line-art${flip ? ' flip' : ''}`}
      ref={root}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1080 120"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* signal line flowing left to right */}
        <path
          className="ink"
          d="M0 78 C 90 78, 120 42, 200 42 S 300 96, 380 78 L 430 78"
          strokeWidth="1.5"
        />
        {/* circuit segment with nodes */}
        <path
          className="ink"
          d="M430 78 L 470 78 L 490 58 L 560 58 M 520 58 L 520 92 L 585 92"
          strokeWidth="1.5"
        />
        <circle className="ink node" cx="470" cy="78" r="3.5" strokeWidth="1.5" />
        <circle className="ink node" cx="560" cy="58" r="3.5" strokeWidth="1.5" />
        <circle className="ink node" cx="585" cy="92" r="3.5" strokeWidth="1.5" />
        {/* wireframe polyhedron */}
        <path
          className="ink"
          d="M700 22 L 748 40 L 748 84 L 700 102 L 652 84 L 652 40 Z"
          strokeWidth="1.5"
        />
        <path
          className="ink"
          d="M700 22 L 700 62 L 652 40 M 700 62 L 748 40 M 700 62 L 700 102"
          strokeWidth="1"
        />
        {/* accent thread continuing out */}
        <path
          className="accent"
          d="M748 62 C 830 62, 850 30, 920 30 S 1010 82, 1080 66"
          strokeWidth="1.5"
        />
        {/* code bracket */}
        <path
          className="ink"
          d="M962 78 L 948 92 L 962 106 M 986 78 L 1000 92 L 986 106"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  )
}
