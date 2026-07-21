import { Link } from 'react-router-dom'

interface Props {
  dark: boolean
  onToggleTheme: () => void
}

/** A minimal header for the /work page: identity + back home + theme. */
export default function WorkHeader({ dark, onToggleTheme }: Props) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
          </svg>
          <span className="mono">surajkushvaha</span>
        </Link>
        <div className="header-actions">
          <Link to="/" className="work-back">
            ← Home
          </Link>
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
