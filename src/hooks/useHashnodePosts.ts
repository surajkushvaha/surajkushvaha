import { useEffect, useState } from 'react'
import type { Blog } from '../data/content'

const HASHNODE_API = 'https://gql.hashnode.com/'

const QUERY = `
  query Posts($host: String!, $first: Int!) {
    publication(host: $host) {
      posts(first: $first) {
        edges {
          node {
            title
            brief
            url
            publishedAt
          }
        }
      }
    }
  }
`

interface State {
  posts: Blog[]
  loading: boolean
  error: boolean
}

/**
 * Fetches the latest posts from a Hashnode publication at runtime (in the
 * visitor's browser). Always current, no manual upkeep. Fails soft: on any
 * error or empty result the section falls back to its empty state.
 */
export function useHashnodePosts(host: string, first = 6): State {
  const [state, setState] = useState<State>({
    posts: [],
    loading: true,
    error: false,
  })

  useEffect(() => {
    const controller = new AbortController()

    fetch(HASHNODE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { host, first } }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((json) => {
        const edges = json?.data?.publication?.posts?.edges ?? []
        const posts: Blog[] = edges.map(
          (e: {
            node: { title: string; brief: string; url: string; publishedAt: string }
          }) => ({
            title: e.node.title,
            summary: e.node.brief,
            url: e.node.url,
            date: e.node.publishedAt,
            source: 'Hashnode',
          }),
        )
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
