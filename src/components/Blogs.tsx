import { ArrowIcon } from '../data/content'
import { useReveal } from '../hooks/useReveal'
import articlesData from '../data/articles.json'

const BLOG_URL = 'https://surajkushvaha.hashnode.dev/'

interface Article {
  title: string
  url: string
  publishedAt: string
  excerpt: string
  coverImage: string | null
  readTime: number | null
}

/** Static list, generated at build time from the Hashnode RSS feed
 *  (scripts/fetch-articles.mjs). No runtime fetch, so it always renders. */
const articles = (articlesData as { articles: Article[] }).articles

function fmt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function Blogs() {
  const root = useReveal<HTMLElement>('.blog-card')

  return (
    <section id="blog" ref={root}>
      <div className="container">
        <div className="section-head">
          <h2>Writing</h2>
          <p>Notes on the things I build and the ideas I keep circling back to.</p>
        </div>

        {articles.length === 0 ? (
          <p className="blog-empty">
            First posts are on the way.{' '}
            <a
              href={BLOG_URL}
              target="_blank"
              rel="noreferrer"
              className="blog-inline-link"
            >
              Read the blog ↗
            </a>
          </p>
        ) : (
          <>
            <div className="blog-grid">
              {articles.map((a) => (
                <a
                  key={a.url}
                  className="blog-card"
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {a.coverImage && (
                    <div className="blog-cover">
                      <img src={a.coverImage} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="blog-card-body">
                    <h3 className="blog-title">{a.title}</h3>
                    <p className="blog-summary">{a.excerpt}</p>
                    <div className="blog-meta">
                      <span className="blog-date">{fmt(a.publishedAt)}</span>
                      {a.readTime ? (
                        <span className="blog-read">{a.readTime} min read</span>
                      ) : null}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <a
              href={BLOG_URL}
              target="_blank"
              rel="noreferrer"
              className="view-all"
            >
              All posts on Hashnode
              <ArrowIcon />
            </a>
          </>
        )}
      </div>
    </section>
  )
}
