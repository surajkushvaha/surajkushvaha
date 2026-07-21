import { ArrowIcon } from '../data/content'
import { useReveal } from '../hooks/useReveal'
import { useHashnodePosts } from '../hooks/useHashnodePosts'

const HASHNODE_HOST = 'surajkushvaha.hashnode.dev'
const BLOG_URL = 'https://surajkushvaha.hashnode.dev/'

/** Formats an ISO date as e.g. "Mar 2026". */
function fmt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function Blogs() {
  const root = useReveal<HTMLElement>('.blog-row')
  const { posts, loading, error } = useHashnodePosts(HASHNODE_HOST)

  return (
    <section id="blog" ref={root}>
      <div className="container">
        <div className="section-head">
          <h2>Writing</h2>
          <p>Notes on the things I build and the ideas I keep circling back to.</p>
        </div>

        {loading ? (
          <p className="blog-empty">Loading posts…</p>
        ) : posts.length === 0 ? (
          <p className="blog-empty">
            {error
              ? 'Posts live on Hashnode. '
              : 'First posts are on the way. '}
            <a href={BLOG_URL} target="_blank" rel="noreferrer" className="blog-inline-link">
              Read the blog ↗
            </a>
          </p>
        ) : (
          <>
            <div className="blog-list">
              {posts.map((b) => (
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
            <a href={BLOG_URL} target="_blank" rel="noreferrer" className="view-all">
              All posts on Hashnode
              <ArrowIcon />
            </a>
          </>
        )}
      </div>
    </section>
  )
}
