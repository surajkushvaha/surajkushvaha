import { useEffect, useMemo, useRef, useState } from 'react'

interface Command {
  group: string
  label: string
  hint?: string
  action: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  onToggleTheme: () => void
}

export default function CommandPalette({ open, onClose, onToggleTheme }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Command[]>(() => {
    const go = (id: string) => () => {
      onClose()
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
    const openUrl = (url: string) => () => {
      onClose()
      window.open(url, '_blank', 'noopener')
    }
    return [
      { group: 'Navigate', label: 'About', hint: 'section', action: go('about') },
      { group: 'Navigate', label: 'Experience', hint: 'section', action: go('experience') },
      { group: 'Navigate', label: 'Projects', hint: 'section', action: go('projects') },
      { group: 'Navigate', label: 'Contact', hint: 'section', action: go('contact') },
      { group: 'Links', label: 'GitHub - surajkushvaha', hint: '↗', action: openUrl('https://github.com/surajkushvaha') },
      { group: 'Links', label: 'GitHub - thanksforfree (experiments)', hint: '↗', action: openUrl('https://github.com/thanksforfree') },
      { group: 'Links', label: 'LinkedIn', hint: '↗', action: openUrl('https://www.linkedin.com/in/surajkushvaha') },
      { group: 'Links', label: 'itch.io - theworstgamecompany', hint: '↗', action: openUrl('https://theworstgamecompany.itch.io') },
      { group: 'Links', label: 'Email', hint: '↗', action: openUrl('mailto:suraj04patel@gmail.com') },
      {
        group: 'Theme',
        label: 'Toggle dark / light mode',
        action: () => {
          onToggleTheme()
          onClose()
        },
      },
    ]
  }, [onClose, onToggleTheme])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setSelected(0), [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter') {
        filtered[selected]?.action()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, selected, onClose])

  if (!open) return null

  let lastGroup = ''

  return (
    <div className="cmdk-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cmdk-panel" role="dialog" aria-modal="true" aria-label="Command menu">
        <div className="cmdk-input-row">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="cmdk-list">
          {filtered.length === 0 && <div className="cmdk-empty">No results found.</div>}
          {filtered.map((cmd, i) => {
            const showLabel = cmd.group !== lastGroup
            lastGroup = cmd.group
            return (
              <div key={cmd.label}>
                {showLabel && <div className="cmdk-group-label">{cmd.group}</div>}
                <div
                  className={`cmdk-item${i === selected ? ' selected' : ''}`}
                  onMouseEnter={() => setSelected(i)}
                  onClick={cmd.action}
                >
                  {cmd.label}
                  {cmd.hint && <span className="item-hint">{cmd.hint}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
