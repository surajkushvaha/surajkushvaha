import Header from './components/Header'
import Hero from './components/Hero'
import Projects from './components/Projects'
import TechStack from './components/TechStack'
import About from './components/About'
import GitHubCards from './components/GitHubCards'
import Connect from './components/Connect'

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Projects />
        <TechStack />
        <About />
        <GitHubCards />
        <Connect />
      </main>
      <footer className="footer">
        © {new Date().getFullYear()} Suraj Kushvaha — built from scratch, as
        usual.
      </footer>
    </>
  )
}
