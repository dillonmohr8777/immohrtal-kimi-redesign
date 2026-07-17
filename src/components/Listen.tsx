import { artist, platforms, type Platform } from '../content/album'
import { AppleMusicIcon, PresaveIcon, SoundCloudIcon, SpotifyIcon, YouTubeIcon } from './icons'

const platformIcons: Record<Platform['id'], () => React.ReactNode> = {
  spotify: SpotifyIcon,
  apple: AppleMusicIcon,
  youtube: YouTubeIcon,
  soundcloud: SoundCloudIcon,
  presave: PresaveIcon,
}

function CoverPlaceholder() {
  return (
    <div className="cover-tilt duality-cover-system relative aspect-square w-full overflow-hidden rounded-2xl border">
      <span className="cover-split" aria-hidden="true" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="font-display chrome-text-light uppercase leading-none" style={{ fontSize: 'clamp(2.6rem, 7vw, 4.2rem)' }}>
          {artist.name}
        </span>
        <span className="font-serif italic mt-3" style={{ fontSize: 'clamp(1.1rem, 2.6vw, 1.6rem)', color: '#eef1f7' }}>
          {artist.albumTitle}
        </span>
        <span className="mono-tag mt-5" style={{ color: 'rgba(255,255,255,0.62)' }}>
          two sides / one record
        </span>
      </div>
    </div>
  )
}

export function Listen() {
  return (
    <section id="listen" aria-labelledby="listen-heading" className="listen-section relative z-10 mx-auto max-w-6xl px-5 py-24 md:py-36">
      <p className="section-eyebrow reveal" data-decode="">01 / Listen</p>
      <h2 id="listen-heading" className="font-display chrome-text reveal mt-5 uppercase" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', lineHeight: 1 }}>
        Play it everywhere
      </h2>
      <p className="reveal reveal-late mt-5 max-w-xl" style={{ color: 'var(--dim)' }}>
        The official links live here as each platform clears. One owned hub for the record,
        the story, the drops, and the first people who catch it early.
      </p>

      <div className="listen-grid mt-14 grid items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
        <div className="reveal mx-auto w-full max-w-md">
          {artist.coverArt ? (
            <img
              src={artist.coverArt}
              alt={`${artist.name} - ${artist.albumTitle} album cover`}
              loading="lazy"
              decoding="async"
              className="cover-tilt aspect-square w-full rounded-2xl object-cover"
              width={640}
              height={640}
            />
          ) : (
            <CoverPlaceholder />
          )}
        </div>

        <ul className="reveal reveal-late m-0 flex list-none flex-col gap-3 p-0">
          {platforms.map((p) => {
            const Icon = platformIcons[p.id]
            const inner = (
              <>
                <span className="platform-icon grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: 'var(--line-strong)' }}>
                  <Icon />
                </span>
                <span className="flex-1 font-body text-[17px] font-medium">{p.label}</span>
                <span className="font-mono text-[10px] tracking-[0.26em] uppercase" style={{ color: p.href ? 'var(--green-txt)' : 'var(--faint)' }}>
                  {p.href ? 'Open' : 'Soon'}
                </span>
              </>
            )
            return (
              <li key={p.id}>
                {p.href ? (
                  <a className="platform-pill" href={p.href} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div className="platform-pill is-dead" aria-label={`${p.label} - link coming soon`}>
                    {inner}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
