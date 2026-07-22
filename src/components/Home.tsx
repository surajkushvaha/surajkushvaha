import { lazy, Suspense } from 'react'
import Header from './Header'
import Hero from './Hero'
import About from './About'
import Experience from './Experience'
import Projects from './Projects'
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
  // the robot is a desktop flourish; skip the WebGL entirely on phones
  const isMobile = useIsMobile()

  return (
    <>
      {!isMobile && (
        <Suspense fallback={null}>
          <Figure />
        </Suspense>
      )}
      <Header dark={dark} onToggleTheme={toggle} onOpenPalette={onOpenPalette} />
      <main id="top">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
