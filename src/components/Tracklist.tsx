import { tracks } from '../content/album'
import { usePlayer } from '../audio/PlayerContext'
import { useGate } from './EmailGate'

function PlayGlyph({ playing }: { playing: boolean }) {
  return playing ? (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="2" y="1" width="3.5" height="12" rx="1" />
      <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M3 1.5v11a1 1 0 0 0 1.52.86l9-5.5a1 1 0 0 0 0-1.72l-9-5.5A1 1 0 0 0 3 1.5z" />
    </svg>
  )
}

export function Tracklist() {
  const { currentIndex, playing, errorIndex } = usePlayer()
  const { unlocked, requestPlay } = useGate()
  const anyAudio = tracks.some((t) => t.src)

  return (
    <section id="tracks" aria-labelledby="tracks-heading" className="relative z-10 mx-auto max-w-4xl px-5 py-24 md:py-36">
      <p className="section-eyebrow reveal" data-decode="">02 / Tracklist</p>
      <h2 id="tracks-heading" className="font-display chrome-text reveal mt-5 uppercase" style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', lineHeight: 1 }}>
        Eleven cuts, no safety net
      </h2>
      <p className="reveal reveal-late mt-5 max-w-xl" style={{ color: 'var(--dim)' }}>
        From notebook smoke to family fire, every title gets its own lane in the delusion.
      </p>

      <ol className="reveal reveal-late mt-12 list-none border-t p-0 m-0" style={{ borderColor: 'var(--line)' }}>
        {tracks.map((track, i) => {
          const isCurrent = currentIndex === i
          const hasAudio = Boolean(track.src)
          const failed = errorIndex === i
          return (
            <li key={i} className={`track-row ${isCurrent ? 'is-current' : ''}`}>
              <span className="font-display text-2xl" style={{ color: isCurrent ? 'var(--signal-txt)' : 'var(--faint)' }} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className="track-title block truncate font-body text-[17px] font-medium tracking-wide">
                  {track.title}
                </span>
                <span className="track-note mono-tag block mt-0.5">
                  {failed
                    ? 'audio missing, drop the MP3 in /public/audio'
                    : hasAudio && !unlocked
                      ? 'unlock, sign the list'
                      : track.note ?? (hasAudio ? 'preview available' : 'track locked')}
                </span>
              </span>
              <span className="flex items-center gap-4">
                {isCurrent && playing && (
                  <span className="eq" aria-hidden="true">
                    <i /><i /><i /><i />
                  </span>
                )}
                {track.duration && (
                  <span className="font-mono text-[12px]" style={{ color: 'var(--faint)' }}>
                    {track.duration}
                  </span>
                )}
                <button
                  type="button"
                  className="play-btn"
                  disabled={!hasAudio}
                  aria-label={
                    !hasAudio
                      ? `${track.title}, audio coming soon`
                      : !unlocked
                        ? `Unlock ${track.title} preview`
                        : isCurrent && playing
                          ? `Pause ${track.title}`
                          : `Play ${track.title}`
                  }
                  onClick={() => requestPlay(i)}
                >
                  <PlayGlyph playing={isCurrent && playing} />
                </button>
              </span>
            </li>
          )
        })}
      </ol>

      {!anyAudio && (
        <p className="mono-tag mt-6">
          audio unlocks here when the final files land. titles above are editable in src/content/album.ts
        </p>
      )}
    </section>
  )
}
