import { skillGroups } from '../data/content'
import { useReveal } from '../hooks/useReveal'

/**
 * Editorial, not a CV dump.
 *
 * The skill pills are gone. A cloud of rounded chips is the single most
 * templated component in the genre — it makes 30 technologies shout at equal
 * volume and says nothing about depth. Set as a quiet typographic index
 * instead, the same information reads as a contents page: scannable, ordered,
 * and confident enough not to decorate itself.
 */
export default function About() {
  const root = useReveal<HTMLElement>('.about-col')

  return (
    <section id="about" ref={root}>
      <div className="container">
        {/* The thesis runs the full measure and is the only thing at this size
            in the section. It used to sit inside a narrow middle column with an
            empty heading column beside it, which spent a third of the row on
            nothing and shrank the one sentence that had to land. */}
        <p className="about-lead">
          I&apos;d rather understand the foundations than ship a wrapper around
          someone else&apos;s library. That&apos;s most of why these projects
          exist.
        </p>

        <div className="about-grid">
          <div className="about-col about-prose">
            <p>
              I&apos;m a Software Engineer with a B.Tech in Computer
              Engineering, three-plus years deep in the SaaS industry, mostly
              Angular frontend architecture and Node.js/Rust backend services,
              with a long detour through web accessibility and PDF/document
              tooling.
            </p>
            <p>
              Outside of work I build complete systems from scratch: an AI
              VTuber with a real-time 3D avatar, an architecture-design platform
              for the Indian market, a published game I shipped mostly to see if
              I could.
            </p>
            <p>
              I&apos;ve also spent real time on the research most people skip:
              training custom OCR models instead of calling an API, and a fully
              local pipeline that retrieves and blends animation from bone data
              across 2,000+ motion-capture clips.
            </p>
          </div>

          <div className="about-col about-index">
            {skillGroups.map((g) => (
              <div className="idx-group" key={g.label}>
                <div className="idx-head">
                  <span className="idx-label">{g.label}</span>
                  <span className="idx-count mono">{g.chips.length}</span>
                </div>
                <ul className="idx-list">
                  {g.chips.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
