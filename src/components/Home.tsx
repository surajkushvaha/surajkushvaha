import { lazy, Suspense } from 'react'
import Header from './Header'
import Hero from './Hero'
import About from './About'
import Experience from './Experience'
import Projects from './Projects'
import Contact from './Contact'
import Footer from './Footer'

const Figure = lazy(() => import('./Figure'))

interface Props {
  dark: boolean
  toggle: () => void
  onOpenPalette: () => void
}

export default function Home({ dark, toggle, onOpenPalette }: Props) {
  return (
    <>
      <Suspense fallback={null}>
        <Figure />
      </Suspense>
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
