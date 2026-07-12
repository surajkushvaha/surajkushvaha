import { useEffect, useState } from 'react'

const SECTIONS = ['about', 'experience', 'projects', 'contact']

interface Props {
  dark: boolean
  onToggleTheme: () => void
  onOpenPalette: () => void
}

export default function Header({ dark, onToggleTheme, onOpenPalette }: Props) {
  const [active, setActive] = useState('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#top" className="logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
          </svg>
          <span className="mono">surajkushvaha</span>
        </a>
        <nav className="main-nav">
          {SECTIONS.map((id) => (
            <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>
              {id[0].toUpperCase() + id.slice(1)}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button className="search-trigger" onClick={onOpenPalette} aria-label="Open command menu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span>Search</span>
            <span className="kbd">⌘K</span>
          </button>
          <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle dark mode">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
