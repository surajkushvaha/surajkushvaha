import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './Header'
import Stage from '../site/Stage'
import RobotVoice from '../site/RobotVoice'
import About from './About'
import Experience from './Experience'
import Projects from './Projects'
import Blogs from './Blogs'
import Contact from './Contact'
import Footer from './Footer'
import { useIsMobile } from '../hooks/useMediaFlags'

const Figure = lazy(() => import('./Figure'))

interface Props {
  dark: boolean
  toggle: () => void
  onOpenPalette: () => void
}

export default function Home({ dark, toggle, onOpenPalette }: Props) {
  // the companion robot is a desktop flourish; skip the WebGL entirely on phones
  const isMobile = useIsMobile()

  /**
   * The page now opens on the full-viewport signature scene, which has its own
   * robot in it. Two things follow from that:
   *
   *  - the sticky document header must not sit on top of the landing. It only
   *    appears once you have scrolled into the written part.
   *  - the companion `Figure` is fixed and full-screen, so mounting it at load
   *    would put a second robot over the first. It waits until you are past the
   *    stage, which also keeps a second WebGL context off the critical path.
   */
  const [inDoc, setInDoc] = useState(false)
  useEffect(() => {
    // the stage occupies SCROLL_VH viewports; the document begins after it
    const onScroll = () => setInDoc(window.scrollY > window.innerHeight * 2.4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <Stage />

      {!isMobile && inDoc && (
        <Suspense fallback={null}>
          <Figure />
        </Suspense>
      )}

      {/* The companion's voice as you read. No input field: it speaks about
          wherever you have arrived, and every line has a written fallback so the
          page is complete with the model unavailable. */}
      {inDoc && <RobotVoice />}

      <div className={`doc-header${inDoc ? ' on' : ''}`}>
        <Header dark={dark} onToggleTheme={toggle} onOpenPalette={onOpenPalette} />
      </div>

      <main id="top">
        <About />
        <Experience />
        <Projects />
        <Blogs />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
