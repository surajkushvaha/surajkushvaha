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

function toBlog(
  title: string,
  link: string,
  date: string,
  html: string,
  cover?: string,
): Blog {
  const text = stripHtml(html)
  const words = text ? text.split(' ').length : 0
  return {
    title,
    url: link,
    date,
    summary: text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text,
    cover: cover || undefined,
    readTime: words ? Math.max(1, Math.round(words / 200)) : undefined,
    source: 'Hashnode',
  }
}

function firstImg(html: string): string | undefined {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : undefined
}

/** Fetch and parse the Hashnode RSS feed directly (no third party). */
async function fetchDirect(feed: string, first: number, signal: AbortSignal): Promise<Blog[]> {
  const res = await fetch(feed, { signal })
  if (!res.ok) throw new Error('rss status')
  const doc = new DOMParser().parseFromString(await res.text(), 'text/xml')
  if (doc.querySelector('parsererror')) throw new Error('parse')
  const items = Array.from(doc.querySelectorAll('item')).slice(0, first)
  return items.map((item) => {
    const get = (sel: string) => item.querySelector(sel)?.textContent?.trim() || ''
    const html =
      item.getElementsByTagName('content:encoded')[0]?.textContent ||
      get('description')
    const cover =
      item.querySelector('enclosure')?.getAttribute('url') ||
      item.getElementsByTagName('media:thumbnail')[0]?.getAttribute('url') ||
      firstImg(html)
    return toBlog(get('title'), get('link'), get('pubDate'), html, cover ?? undefined)
  })
}

/** Fallback: rss2json converts the feed to CORS-friendly JSON. */
async function fetchViaProxy(feed: string, first: number, signal: AbortSignal): Promise<Blog[]> {
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(
    feed,
  )}&count=${first}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('proxy status')
  const json = await res.json()
  if (json?.status !== 'ok' || !Array.isArray(json.items)) throw new Error('bad feed')
  return json.items
    .slice(0, first)
    .map((it: {
      title: string
      link: string
      pubDate: string
      content?: string
      description?: string
      thumbnail?: string
      enclosure?: { link?: string }
    }) =>
      toBlog(
        it.title,
        it.link,
        it.pubDate,
        it.content || it.description || '',
        it.thumbnail || it.enclosure?.link,
      ),
    )
}

/**
 * Pulls the latest posts from a Hashnode publication's public RSS feed at
 * runtime. Hashnode made the GraphQL API Pro-only in May 2026, so RSS is the
 * free path. Tries the feed directly first; if the browser blocks it
 * cross-origin, falls back to rss2json. Fails soft to the section's link-out.
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

    ;(async () => {
      let posts: Blog[] | null = null
      try {
        posts = await fetchDirect(feed, first, controller.signal)
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        try {
          posts = await fetchViaProxy(feed, first, controller.signal)
        } catch (e2) {
          if ((e2 as Error).name === 'AbortError') return
        }
      }
      if (controller.signal.aborted) return
      if (posts) setState({ posts, loading: false, error: false })
      else setState({ posts: [], loading: false, error: true })
    })()

    return () => controller.abort()
  }, [host, first])

  return state
}
