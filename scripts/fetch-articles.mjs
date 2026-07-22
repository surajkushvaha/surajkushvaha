// Build-time fetch of the latest Hashnode posts into a static JSON file.
// Runs as a `prebuild` step, so every deploy refreshes the blog list without
// any runtime fetch (no CORS, no Pro GraphQL API, no third-party service).
// If Hashnode is unreachable during a build, the existing file is kept.

import { writeFileSync, readFileSync } from 'node:fs'

const HOST = 'surajkushvaha.hashnode.dev'
const FEED = `https://${HOST}/rss.xml`
const OUT = new URL('../src/data/articles.json', import.meta.url)
const LIMIT = 6

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim()
}

function strip(html) {
  // unwrap CDATA + entities first, THEN remove tags (order matters: a raw
  // <![CDATA[ ... ]]> wrapper would otherwise be swallowed as a "tag")
  return decode(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? m[1] : ''
}

function keepExisting() {
  try {
    readFileSync(OUT)
    console.warn('[articles] keeping the previously committed articles.json')
    process.exit(0)
  } catch {
    writeFileSync(OUT, JSON.stringify({ articles: [] }, null, 2))
    process.exit(0)
  }
}

async function main() {
  let res
  try {
    res = await fetch(FEED, { headers: { 'user-agent': 'portfolio-build' } })
  } catch (e) {
    console.warn('[articles] fetch failed:', e.message)
    return keepExisting()
  }
  if (!res.ok) {
    console.warn('[articles] feed responded', res.status)
    return keepExisting()
  }

  const xml = await res.text()
  const items = xml
    .split(/<item>/i)
    .slice(1)
    .map((s) => s.split(/<\/item>/i)[0])

  const articles = items.slice(0, LIMIT).map((block) => {
    const html = tag(block, 'content:encoded') || tag(block, 'description')
    const text = strip(html)
    const enclosure = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i)
    const img = html.match(/<img[^>]+src=["']([^"']+)["']/i)
    const words = text ? text.split(' ').length : 0
    return {
      title: decode(tag(block, 'title')),
      url: decode(tag(block, 'link')),
      publishedAt: decode(tag(block, 'pubDate')),
      excerpt: text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text,
      coverImage: (enclosure && enclosure[1]) || (img && img[1]) || null,
      readTime: words ? Math.max(1, Math.round(words / 200)) : null,
    }
  })

  writeFileSync(OUT, JSON.stringify({ articles }, null, 2))
  console.log(`[articles] wrote ${articles.length} posts from ${HOST}`)
}

main()
