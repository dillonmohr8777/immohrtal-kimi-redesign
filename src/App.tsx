import { useRef } from 'react'
import { PlayerProvider } from './audio/PlayerContext'
import { EmailGateProvider } from './components/EmailGate'
import { useAfterHours } from './hooks/useAfterHours'
import { useReveal } from './hooks/useReveal'
import type { SpineEngine } from './spine/config'
import { Nav } from './components/Nav'
import { Hero, LogoOutro, MarqueeDivider } from './components/Hero'
import { SpineStage } from './components/SpineStage'
import { SpineRail } from './components/SpineRail'
import { Loader } from './components/Loader'
import { Listen } from './components/Listen'
import { Tracklist } from './components/Tracklist'
import { PlayerBar } from './components/PlayerBar'
import { Story } from './components/Story'
import { Contact, Footer } from './components/Contact'

export default function App() {
  useReveal()
  const engineRef = useRef<SpineEngine | null>(null)
  const { dark } = useAfterHours()

  return (
    <PlayerProvider>
      <EmailGateProvider>
      <div className={`grain${dark ? ' page-dark' : ''}`}>
        <a className="skip-link" href="#listen">
          Skip to content
        </a>
        <SpineStage engineRef={engineRef} dark={dark} />
        <SpineRail engineRef={engineRef} />
        <Loader engineRef={engineRef} />
        <Nav />
        <main>
          <Hero />
          <MarqueeDivider />
          <Listen />
          <Tracklist />
          <Story />
          <Contact />
          <LogoOutro />
        </main>
        <Footer />
        <PlayerBar />
      </div>
      </EmailGateProvider>
    </PlayerProvider>
  )
}
