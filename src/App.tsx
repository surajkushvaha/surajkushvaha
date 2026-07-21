import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Work from './components/Work'
import CommandPalette from './components/CommandPalette'
import ScrollProgress from './components/ScrollProgress'
import Cursor from './components/Cursor'
import { useTheme } from './hooks/useTheme'
import { useSmoothScroll } from './hooks/useSmoothScroll'

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
      <Cursor />
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
      </Routes>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onToggleTheme={toggle}
      />
    </BrowserRouter>
  )
}
