import { skillGroups } from '../data/content'
import { useReveal } from '../hooks/useReveal'

export default function About() {
  const root = useReveal<HTMLElement>('.about-grid > div')

  return (
    <section id="about" ref={root}>
      <div className="container">
        <div className="about-grid">
          <div>
            <span className="eyebrow">// about</span>
            <h2>A bit about how I work</h2>
            <p>
              I&apos;m a Software Engineer with a B.Tech in Computer
              Engineering, three-plus years deep in the SaaS industry — mostly
              Angular frontend architecture and Node.js/Rust backend services,
              with a long detour through web accessibility and PDF/document
              tooling.
            </p>
            <p>
              Outside of work I build complete systems from scratch: an AI
              VTuber with a real-time 3D avatar, an architecture-design
              platform for the Indian market, a published game I shipped
              mostly to see if I could. I&apos;d rather understand the
              foundations than ship a wrapper around someone else&apos;s
              library — that&apos;s most of why these projects exist.
            </p>
            <p>
              I&apos;ve also spent real time on the research most people skip:
              training custom OCR models (Detectron2, Mask R-CNN, PyTorch
              ViTs) instead of just calling an API, prototyping a fully local
              AI-companion pipeline that retrieves and blends animation from
              bone data across 2,000+ motion-capture clips, and writing my own
              review and test-generation tooling for AI coding assistants. I
              also like turning dense material into something watchable —
              built an AI agent that turns research papers into narrated video
              scripts.
            </p>
          </div>
          <div>
            {skillGroups.map((g) => (
              <div className="skill-group" key={g.label}>
                <div className="skill-group-label">{g.label}</div>
                <div className="chip-row">
                  {g.chips.map((c) => (
                    <span className="chip" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
