import { useState } from 'react'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Header from './components/Header'
import Hero from './components/Hero'
import Projects from './components/Projects'
import TechStack from './components/TechStack'
import About from './components/About'
import GitHubCards from './components/GitHubCards'
import Connect from './components/Connect'
import { useSmoothScroll } from './hooks/useSmoothScroll'

export default function App() {
  const [ready, setReady] = useState(false)
  useSmoothScroll()

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <Header />
      <main>
        <Hero ready={ready} />
        <Projects />
        <TechStack />
        <About />
        <GitHubCards />
        <Connect />
      </main>
      <footer className="footer">
        <div className="container">
          <span>© {new Date().getFullYear()} Suraj Kushvaha</span>
          <span>Ahmedabad, India</span>
          <span>built from scratch, as usual</span>
        </div>
      </footer>
    </>
  )
}
