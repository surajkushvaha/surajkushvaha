import { useEffect, useState } from 'react'
import type { Blog } from '../data/content'

interface State {
  posts: Blog[]
  loading: boolean
  error: boolean
}

function stripHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ')
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.textContent || '').replace(/\s+/g, ' ').trim()
}

interface Rss2JsonItem {
  title: string
  link: string
  pubDate: string
  description?: string
  content?: string
  thumbnail?: string
  enclosure?: { link?: string }
}

/**
 * Pulls the latest posts from a Hashnode publication's public RSS feed at
 * runtime (in the visitor's browser), converted to JSON via rss2json so it
 * works cross-origin. Uses RSS rather than the GraphQL API because Hashnode
 * made the GraphQL API Pro-only in May 2026; RSS is still free and public.
 * Fails soft: any error or empty result falls back to the section's link-out.
 */
export function useHashnodePosts(host: string, first = 6): State {
  const [state, setState] = useState<State>({
    posts: [],
    loading: true,
    error: false,
  })

  useEffect(() => {
    const controller = new AbortController()
    const feed = `https://${host}/rss.xml`
    const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
      feed,
    )}&count=${first}`

    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((json) => {
        if (json?.status !== 'ok' || !Array.isArray(json.items)) {
          throw new Error('bad feed')
        }
        const posts: Blog[] = json.items
          .slice(0, first)
          .map((it: Rss2JsonItem) => {
            const text = stripHtml(it.content || it.description || '')
            const words = text ? text.split(' ').length : 0
            const summary =
              text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text
            return {
              title: it.title,
              summary,
              url: it.link,
              date: it.pubDate,
              cover: it.thumbnail || it.enclosure?.link || undefined,
              readTime: words ? Math.max(1, Math.round(words / 200)) : undefined,
              source: 'Hashnode',
            }
          })
        setState({ posts, loading: false, error: false })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setState({ posts: [], loading: false, error: true })
      })

    return () => controller.abort()
  }, [host, first])

  return state
}
