import { useEffect } from 'react'
import { projects } from '../data/content'
import { Featured } from './Projects'
import Blogs from './Blogs'
import Footer from './Footer'
import WorkHeader from './WorkHeader'
import { useReveal } from '../hooks/useReveal'

interface Props {
  dark: boolean
  toggle: () => void
}

export default function Work({ dark, toggle }: Props) {
  // arriving from the home link should start at the top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const root = useReveal<HTMLElement>('.feat')

  return (
    <>
      <WorkHeader dark={dark} onToggleTheme={toggle} />
      <main id="top">
        <section className="work-hero">
          <div className="container">
            <h1 className="work-title">Everything I&apos;ve built</h1>
            <p className="work-intro">
              Production work, side projects, and research. A mix of things
              that shipped and things that exist purely because the idea
              wouldn&apos;t leave me alone.
            </p>
          </div>
        </section>

        <section ref={root}>
          <div className="container">
            <div className="feat-grid work-grid">
              {projects.map((p) => (
                <Featured key={p.name} project={p} />
              ))}
            </div>
            <p className="also-built">
              Also built: an agent framework with Obsidian-based memory, a
              second-iteration VRM VTuber (jessica-v2), a browser game prototype
              (gamepoc), a dependency-free multi-source screen recorder (vanilla
              JS, MediaRecorder API, zero libraries), an Angular + Tauri offline
              desktop app, a Spotify-style music app with IndexedDB-based
              recommendations and no backend, gopggo (a PG/hostel search
              platform), and arigato (a personal Angular component library).
            </p>
          </div>
        </section>

        <Blogs />
      </main>
      <Footer />
    </>
  )
}
