import { tracks } from '../content/album'
import { usePlayer } from '../audio/PlayerContext'

function fmt(t: number) {
  if (!Number.isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Sticky glass player, appears once a track has been started. */
export function PlayerBar() {
  const { currentIndex, playing, time, duration, toggle, seek } = usePlayer()
  if (currentIndex === null) return null
  const track = tracks[currentIndex]
  const fill = duration > 0 ? (time / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3" role="region" aria-label="Audio player">
      <div className="glass-panel mx-auto flex max-w-3xl items-center gap-4 rounded-2xl px-4 py-3">
        <button
          type="button"
          className="play-btn shrink-0"
          onClick={toggle}
          aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <rect x="2" y="1" width="3.5" height="12" rx="1" />
              <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <path d="M3 1.5v11a1 1 0 0 0 1.52.86l9-5.5a1 1 0 0 0 0-1.72l-9-5.5A1 1 0 0 0 3 1.5z" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-body text-[14px] font-medium">
              {String(currentIndex + 1).padStart(2, '0')}, {track.title}
            </span>
            <span className="font-mono text-[11px] shrink-0" style={{ color: 'var(--faint)' }}>
              {fmt(time)} / {fmt(duration)}
            </span>
          </div>
          <input
            type="range"
            className="seek mt-2"
            min={0}
            max={duration || 0}
            step={0.1}
            value={time}
            style={{ ['--seek-fill' as string]: `${fill}%` }}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label={`Seek within ${track.title}`}
          />
        </div>
      </div>
    </div>
  )
}
