import { useCallback, useEffect, useState } from 'react'

function initialDark(): boolean {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark') return true
  if (stored === 'light') return false
  // dark is the canonical design: the figure is lit in an unlit room. light
  // mode is the respectful alternative, not the default.
  return true
}

export function useTheme() {
  const [dark, setDark] = useState(initialDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = useCallback(() => setDark((d) => !d), [])
  return { dark, toggle }
}
