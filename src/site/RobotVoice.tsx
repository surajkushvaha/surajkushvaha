import { useEffect, useRef, useState } from 'react'
import '../styles/voice.css'

/**
 * The robot's voice as you read the page.
 *
 * This is the "AI, not a chatbot" piece, and the model is Noomo Beat: there, a
 * short quiz drives an AI that changes the *scene*, never a message list. So
 * there is no input field anywhere here. You scroll, you arrive somewhere, and
 * the companion says one short thing about where you are.
 *
 * An earlier attempt at this was a text box you typed questions into. That is a
 * chatbot with a game skin and it was deleted.
 *
 * Three rules make it safe to ship:
 *
 *  1. **Never on the critical path.** Every section has a written line that is
 *     shown immediately. The generated one replaces it only if and when it
 *     arrives, so the page is complete with the API down, the key missing, or
 *     the visitor offline.
 *  2. **Once per section, cached.** Not per scroll, not per hover.
 *  3. **Capped short.** A long answer would cover the page it is describing, so
 *     anything over two sentences is cut back to the written line.
 */

type Topic = {
  id: string
  /** what to ask the model. The endpoint's system prompt already pins it to the CV. */
  ask: string
  /** shown immediately, and kept if the model is unavailable or too verbose */
  fallback: string
}

const TOPICS: Topic[] = [
  {
    id: 'about',
    ask: 'What kind of engineer is he? One dry sentence, max 18 words, no technology list.',
    fallback: 'He would rather understand the foundations than wrap someone else’s library.',
  },
  {
    id: 'experience',
    ask: 'What is notable about his three years at Asite? One dry sentence, max 18 words.',
    fallback: 'Three years, one company, four job titles. He kept being handed the thing nobody wanted to own.',
  },
  {
    id: 'projects',
    ask: 'What do his side projects have in common? One dry sentence, max 18 words.',
    fallback: 'Every one of these exists because the idea would not leave him alone.',
  },
  {
    id: 'blog',
    ask: 'Why does he write about his work? One dry sentence, max 18 words.',
    fallback: 'He writes the notes he wishes he had found first.',
  },
  {
    id: 'contact',
    ask: 'Encourage the reader to email him. One dry sentence, max 18 words, invent nothing.',
    fallback: 'His email is right there, and he does actually answer it.',
  },
]

const MAX = 180

export default function RobotVoice() {
  const [line, setLine] = useState<string | null>(null)
  const cache = useRef(new Map<string, string>())
  const current = useRef('')

  useEffect(() => {
    const show = (topic: Topic) => {
      if (current.current === topic.id) return
      current.current = topic.id

      const cached = cache.current.get(topic.id)
      if (cached) {
        setLine(cached)
        return
      }

      // the written line goes up straight away; the model only ever upgrades it
      setLine(topic.fallback)
      cache.current.set(topic.id, topic.fallback)

      fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: topic.ask }),
      })
        .then((r) => r.json())
        .then((d: { answer?: string }) => {
          const a = d.answer?.trim()
          // too long means it would cover the section it is describing
          if (!a || a.length > MAX) return
          cache.current.set(topic.id, a)
          // only swap it in if the reader is still in this section
          if (current.current === topic.id) setLine(a)
        })
        .catch(() => {
          /* the written line is already showing; nothing to do */
        })
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const topic = TOPICS.find((t) => t.id === e.target.id)
          if (topic) show(topic)
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )

    TOPICS.forEach((t) => {
      const el = document.getElementById(t.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  if (!line) return null

  return (
    <div className="rv" role="status" aria-live="polite">
      <span className="rv-who mono">Cuty</span>
      <p className="rv-line">{line}</p>
    </div>
  )
}
