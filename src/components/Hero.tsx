import { useRef } from 'react'
import { artist } from '../content/album'
import { TiltBox } from './TiltBox'
import { prefersReducedMotion } from '../hooks/useReveal'

/**
 * The headshot splits into the album cover's red/blue halves as the
 * cursor moves across it. Tap toggles a 50/50 split on touch.
 */
function DualityShot() {
  const ref = useRef<HTMLSpanElement>(null)
  const queued = useRef(false)
  const x = useRef(50)
  const fine = () => window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()

  const set = (split: number, on: boolean) => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--split', `${split}%`)
    el.style.setProperty('--duality', on ? '1' : '0')
  }

  return (
    <span
      ref={ref}
      className="pop-box sheen duality-shot block"
      onMouseMove={(e) => {
        if (!fine()) return
        const r = ref.current?.getBoundingClientRect()
        if (!r) return
        x.current = ((e.clientX - r.left) / r.width) * 100
        if (queued.current) return
        queued.current = true
        requestAnimationFrame(() => {
          queued.current = false
          set(Math.max(0, Math.min(100, x.current)), true)
        })
      }}
      onMouseLeave={() => set(50, false)}
      onClick={() => {
        if (fine() || prefersReducedMotion()) return
        const on = ref.current?.style.getPropertyValue('--duality') === '1'
        set(50, !on)
      }}
    >
      <img
        src={artist.heroImage ?? ''}
        alt={`${artist.name} portrait`}
        fetchPriority="high"
        decoding="async"
        className="block aspect-square w-full object-cover"
        width={1080}
        height={1080}
      />
      <span aria-hidden="true" className="duality-layer duality-red" />
      <span aria-hidden="true" className="duality-layer duality-blue" />
    </span>
  )
}

function AnimatedQuoteLine({
  line,
  lineIndex,
  isFirst,
  isLast,
}: {
  line: string
  lineIndex: number
  isFirst: boolean
  isLast: boolean
}) {
  return (
    <span
      className="opening-line block"
      style={{
        fontSize: 'clamp(1.35rem, 3.4vw, 2.9rem)',
        lineHeight: 1.2,
        textWrap: 'balance',
      }}
    >
      {isFirst && <span className="opening-quote-mark">"</span>}
      {line.split(' ').map((word, wordIndex) => {
        const delay = lineIndex * 420 + wordIndex * 95
        return (
          <span key={`${lineIndex}-${wordIndex}-${word}`} className="ink-word" style={{ animationDelay: `${delay}ms, ${delay + 160}ms` }}>
            {word}
            {wordIndex < line.split(' ').length - 1 ? ' ' : ''}
          </span>
        )
      })}
      {isLast && <span className="opening-quote-mark">"</span>}
    </span>
  )
}

export function Hero() {
  return (
    <header
      id="top"
      className="home-hero relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 py-20 text-center"
    >
      <div aria-hidden="true" className="hero-aura absolute inset-0 z-0" />
      <div aria-hidden="true" className="hero-vignette absolute inset-0 z-[1]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center">
        <h1 className="sr-only">
          {artist.name}, {artist.albumTitle}
        </h1>

        <p className="mono-tag hero-session reveal" style={{ color: 'var(--signal-txt)' }}>
          {artist.sessionTag}
        </p>

        {/* the shot leads: first thing you see */}
        <div className="reveal reveal-late relative mt-8 w-full max-w-[440px]">
          <div aria-hidden="true" className="hero-shadow-field" />
          <TiltBox max={5}>
            {artist.heroImage ? (
              <DualityShot />
            ) : (
              <span className="pop-box sheen block">
                <span className="artist-slot artist-slot-neutral flex aspect-square w-full flex-col items-center justify-center gap-4 px-6">
                  <span className="split-lines" aria-hidden="true" />
                  <span className="font-display chrome-text-light text-4xl uppercase tracking-wide sm:text-6xl">The Shot</span>
                  <span className="mono-tag text-center">artist image placeholder</span>
                </span>
              </span>
            )}
          </TiltBox>
        </div>

        {artist.introQuoteLines.length > 0 && (
          <blockquote
            className="opening-bar reveal reveal-late m-0 mt-10 w-full border-y px-2 py-8 font-serif"
            style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
          >
            {artist.introQuoteLines.map((line, i) => (
              <AnimatedQuoteLine
                key={line}
                line={line}
                lineIndex={i}
                isFirst={i === 0}
                isLast={i === artist.introQuoteLines.length - 1}
              />
            ))}
          </blockquote>
        )}

        <p
          className="font-serif italic reveal reveal-late mt-8"
          style={{
            fontSize: 'clamp(1.7rem, 5vw, 3.2rem)',
            lineHeight: 1.12,
            color: 'var(--ink)',
          }}
        >
          {artist.albumTitle}
        </p>

        <p
          className="reveal reveal-later mx-auto mt-4 max-w-md font-mono text-[13px] leading-relaxed tracking-[0.08em]"
          style={{ color: 'var(--dim)' }}
        >
          {artist.tagline}
        </p>

        <div className="reveal reveal-later mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
          <a className="btn btn-chrome w-full sm:w-auto" href="#listen">
            Listen Now
          </a>
          <a className="btn btn-ghost w-full sm:w-auto" href="#tracks">
            Tracklist
          </a>
        </div>
      </div>

      <a
        href="#listen"
        aria-label="Scroll to the listen section"
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] uppercase no-underline"
        style={{ color: 'var(--faint)' }}
      >
        Scroll
      </a>
    </header>
  )
}

/** Big logo near the bottom of the page: materializes like ink
 *  soaking into the paper as it scrolls into view. */
export function LogoOutro() {
  return (
    <section aria-label={`${artist.name} logo`} className="relative z-10 overflow-hidden px-5 py-28 md:py-40">
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        <div className="ink-reveal reveal w-full max-w-[560px]">
          <img
            src="logo-mark.png"
            alt={artist.name}
            className="block h-auto w-full"
            width={1000}
            height={906}
            loading="lazy"
          />
        </div>
        <p className="mono-tag reveal reveal-later mt-8" style={{ color: 'var(--signal-txt)' }}>
          {artist.releaseTag}
        </p>
      </div>
    </section>
  )
}

export function MarqueeDivider() {
  const phrase =
    artist.marqueeBars.length > 0
      ? artist.marqueeBars.map((b) => b.toUpperCase()).join(' / ') + ' / '
      : `${artist.name} / ${artist.albumTitle.toUpperCase()} / ${artist.releaseTag} / `
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-inner font-mono text-[12px] tracking-[0.3em]" style={{ color: 'var(--faint)' }}>
        <span>{phrase.repeat(4)}</span>
        <span>{phrase.repeat(4)}</span>
      </div>
    </div>
  )
}
