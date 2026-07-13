import { useEffect, useRef } from 'react'
import lottie from 'lottie-web/build/player/lottie_light'
import animationData from '../lottie/scroll-indicator.json'

/** Hand-written Lottie scroll hint shown under the hero. */
export default function ScrollLottie() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    })
    return () => anim.destroy()
  }, [])

  return <div className="scroll-lottie" ref={ref} aria-hidden="true" />
}
