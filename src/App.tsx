import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Work from './components/Work'
import CommandPalette from './components/CommandPalette'
import ScrollProgress from './components/ScrollProgress'
import { useTheme } from './hooks/useTheme'
import { useSmoothScroll } from './hooks/useSmoothScroll'

// The world is a separate chunk on purpose. R3F, drei and the scene are a
// large payload, and nobody landing on the document site should pay for it.
const World = lazy(() => import('./world/World'))

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
    <BrowserRouter>
      <ScrollProgress />
      <Routes>
        <Route
          path="/"
          element={
            <Home
              dark={dark}
              toggle={toggle}
              onOpenPalette={() => setPaletteOpen(true)}
            />
          }
        />
        <Route path="/work" element={<Work dark={dark} toggle={toggle} />} />
        <Route
          path="/world"
          element={
            <Suspense fallback={<div className="world-boot">Loading the world</div>}>
              <World />
            </Suspense>
          }
        />
      </Routes>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onToggleTheme={toggle}
      />
    </BrowserRouter>
  )
}
