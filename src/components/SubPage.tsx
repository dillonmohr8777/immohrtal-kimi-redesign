import { useRef, type ReactNode } from 'react'
import { useAfterHours } from '../hooks/useAfterHours'
import { useReveal } from '../hooks/useReveal'
import { PlayerProvider } from '../audio/PlayerContext'
import type { SpineEngine } from '../spine/config'
import { SpineStage } from './SpineStage'
import { Nav } from './Nav'
import { Footer } from './Contact'

/**
 * Shared shell for every subpage (About / Video / Blog / Contact / posts).
 *
 * SITE RULE (do not break): every page carries the exact home-page
 * background, the WebGL spine world. It lives here in SubPage, so any new
 * page built on SubPage inherits it automatically. Never swap this for a
 * static backdrop again; the spine is the continuity of the brand.
 */
export function SubPage({
  children,
  tone = 'light',
  base = './',
}: {
  children: ReactNode
  tone?: 'light' | 'dark'
  /** relative path back to the site root, '../' from /blog/ pages */
  base?: string
}) {
  useReveal()
  const { dark } = useAfterHours()
  const engineRef = useRef<SpineEngine | null>(null)
  const isDark = tone === 'dark' || dark
  return (
    <PlayerProvider>
      <div className={`grain ${isDark ? 'page-dark' : ''}`}>
        <SpineStage engineRef={engineRef} dark={isDark} />
        <Nav home={false} base={base} />
        <main className="relative z-10 mx-auto min-h-[80svh] w-full max-w-4xl px-5 pb-24 pt-36">{children}</main>
        <Footer base={base} />
      </div>
    </PlayerProvider>
  )
}
