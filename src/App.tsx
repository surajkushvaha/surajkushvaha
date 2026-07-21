import { lazy, Suspense, useEffect, useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'
import CommandPalette from './components/CommandPalette'
import ScrollProgress from './components/ScrollProgress'
import Cursor from './components/Cursor'
import { useTheme } from './hooks/useTheme'
import { useSmoothScroll } from './hooks/useSmoothScroll'

const Figure = lazy(() => import('./components/Figure'))

export default function App() {
  const { dark, toggle } = useTheme()
  const [paletteOpen, setPaletteOpen] = useState(false)
  useSmoothScroll()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <Figure />
      </Suspense>
      <ScrollProgress />
      <Cursor />
      <Header
        dark={dark}
        onToggleTheme={toggle}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <main id="top">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Contact />
      </main>
      <Footer />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onToggleTheme={toggle}
      />
    </>
  )
}
