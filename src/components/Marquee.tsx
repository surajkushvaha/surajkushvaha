import { Fragment } from 'react'

interface Props {
  items: string[]
  ghost?: boolean
  reverse?: boolean
  speed?: number
  className?: string
}

/** Infinite CSS marquee — track holds two identical chunks, shifts -50%. */
export default function Marquee({
  items,
  ghost = false,
  reverse = false,
  speed = 40,
  className = '',
}: Props) {
  const chunk = (
    <span className="marquee-chunk">
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className={`item${ghost ? ' ghost' : ''}`}>{item}</span>
          <span className="sep">✦</span>
        </Fragment>
      ))}
    </span>
  )

  return (
    <div
      className={`marquee${reverse ? ' reverse' : ''} ${className}`}
      style={{ '--speed': `${speed}s` } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className="marquee-track">
        {chunk}
        {chunk}
      </div>
    </div>
  )
}
