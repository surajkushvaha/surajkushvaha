import { blogs, ArrowIcon } from '../data/content'
import { useReveal } from '../hooks/useReveal'

/** Formats an ISO date as e.g. "Mar 2026". */
function fmt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function Blogs() {
  const root = useReveal<HTMLElement>('.blog-row')

  return (
    <section id="blog" ref={root}>
      <div className="container">
        <div className="section-head">
          <h2>Writing</h2>
          <p>Notes on the things I build and the ideas I keep circling back to.</p>
        </div>

        {blogs.length === 0 ? (
          <p className="blog-empty">
            First posts are on the way. In the meantime, the projects above are
            where most of the thinking lives.
          </p>
        ) : (
          <div className="blog-list">
            {blogs.map((b) => (
              <a
                key={b.url}
                className="blog-row"
                href={b.url}
                target="_blank"
                rel="noreferrer"
              >
                <div className="blog-main">
                  <h3 className="blog-title">{b.title}</h3>
                  <p className="blog-summary">{b.summary}</p>
                </div>
                <div className="blog-meta">
                  {b.source && <span className="blog-source">{b.source}</span>}
                  <span className="blog-date">{fmt(b.date)}</span>
                  <ArrowIcon />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
