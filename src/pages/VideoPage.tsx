import { useEffect, useRef, useState, type FormEvent } from 'react'
import { artist } from '../content/album'
import { track } from '../lib/analytics'
import { submitToList } from '../lib/list'
import { SubPage } from '../components/SubPage'
import { TiltBox } from '../components/TiltBox'

const PREVIEW_SECONDS = 30
const STORAGE_KEY = 'immohrtal.list'

function isUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function VideoPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [gateOpen, setGateOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hold playback at the preview mark until the viewer joins the list.
  useEffect(() => {
    const v = videoRef.current
    if (!v || unlocked) return
    const onTime = () => {
      if (v.currentTime >= PREVIEW_SECONDS) {
        v.pause()
        v.currentTime = PREVIEW_SECONDS
        setGateOpen(true)
        track('gate_open', { source: 'video' })
      }
    }
    const onSeeking = () => {
      if (v.currentTime > PREVIEW_SECONDS) v.currentTime = PREVIEW_SECONDS
    }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('seeking', onSeeking)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('seeking', onSeeking)
    }
  }, [unlocked])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const email = String(data.get('email') ?? '').trim()
    if (!email) return
    setBusy(true)
    setError(null)
    try {
      await submitToList({
        email,
        source: 'video gate, Picking Up My Notepad',
        'bot-field': String(data.get('bot-field') ?? ''),
      })
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* private mode, session only */
      }
      track('gate_signup', { source: 'video' })
      setUnlocked(true)
      setGateOpen(false)
      const v = videoRef.current
      if (v) void v.play()
    } catch {
      setError('Could not reach the list right now. Give it a second and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SubPage tone="dark">
      <p className="section-eyebrow reveal" data-decode="">Official video</p>
      <h1 className="font-display chrome-text reveal mt-5 uppercase" style={{ fontSize: 'clamp(2.4rem, 6.5vw, 4.6rem)', lineHeight: 1 }}>
        Picking Up My Notepad
      </h1>
      <p className="font-serif italic reveal reveal-late mt-4" style={{ fontSize: 'clamp(1.2rem, 2.8vw, 1.7rem)', color: 'var(--ink)' }}>
        {artist.name} · 8 1 4 · Erie, PA
      </p>

      <div className="reveal reveal-late mt-12 w-full">
        <TiltBox max={3}>
          <figure className="pop-box relative m-0 block p-3">
            <video
              ref={videoRef}
              controls
              playsInline
              preload="metadata"
              poster="video/notepad-poster.jpg"
              className="block h-auto w-full rounded-xl"
            >
              <source src="video/picking-up-my-notepad.mp4" type="video/mp4" />
              Your browser does not support embedded video.
              <a href="video/picking-up-my-notepad.mp4">Download it instead</a>.
            </video>
            <figcaption className="mono-tag mt-3 pb-1 text-center">
              {unlocked
                ? 'Picking Up My Notepad // official video // 2:52'
                : 'Picking Up My Notepad // first 30 seconds free // join the list for the rest'}
            </figcaption>

            {gateOpen && (
              <div
                className="absolute inset-3 z-20 flex items-center justify-center rounded-xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="video-gate-heading"
                style={{ background: 'rgba(11, 15, 21, 0.86)', backdropFilter: 'blur(6px)' }}
              >
                <div
                  className="w-full max-w-md border p-7 md:p-9"
                  style={{ background: '#f7f9fb', color: '#141922', borderColor: 'rgba(20,25,34,0.25)' }}
                >
                  <p className="mono-tag" style={{ color: '#0d6bcc' }}>THE LIST // KEEP WATCHING</p>
                  <h3
                    id="video-gate-heading"
                    className="font-display mt-3 uppercase"
                    style={{ fontSize: 'clamp(1.7rem, 5vw, 2.4rem)', lineHeight: 0.98 }}
                  >
                    Want the rest of the video?
                  </h3>
                  <p className="mt-3 text-[15px]" style={{ color: 'rgba(20,25,34,0.72)' }}>
                    You just watched the first thirty seconds. Drop your email and the
                    full video keeps playing right here. Release updates only. If not now, when?
                  </p>
                  <form onSubmit={submit} className="mt-5">
                    <p className="hidden" aria-hidden="true">
                      <label>skip this<input name="bot-field" tabIndex={-1} autoComplete="off" /></label>
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="you@wherever.com"
                        autoComplete="email"
                        className="w-full border bg-white px-4 py-3 font-mono text-[13px] outline-none"
                        style={{ borderColor: 'rgba(20,25,34,0.3)', color: '#141922' }}
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        className="mono-tag shrink-0 cursor-pointer border-0 px-6 py-3"
                        style={{ background: '#141922', color: '#f7f9fb', opacity: busy ? 0.6 : 1 }}
                      >
                        {busy ? 'UNLOCKING' : 'KEEP WATCHING //'}
                      </button>
                    </div>
                    {error && (
                      <p className="mono-tag mt-3" role="alert" style={{ color: '#b3261e' }}>{error}</p>
                    )}
                  </form>
                </div>
              </div>
            )}
          </figure>
        </TiltBox>
      </div>

      <div className="mt-10 flex flex-col gap-6">
        <p className="reveal m-0 max-w-2xl text-[16.5px] leading-[1.8]" style={{ color: 'var(--dim)' }}>
          A living newsprint collage. Torn headlines from Erie to Pittsburgh, the
          lighthouse in the storm, the man in the moon, a white dog walking a park
          path toward the bridge. Every cut rides the beat until the whole 814
          world breathes and warps like ink in water.
        </p>
        <p className="reveal reveal-late m-0 max-w-2xl text-[16.5px] leading-[1.8]" style={{ color: 'var(--dim)' }}>
          It ends where the music starts. Family.
        </p>
      </div>

      <div className="reveal reveal-later mt-14 flex flex-col gap-4 sm:flex-row">
        <a className="btn btn-chrome" href="./index.html#listen">Hear the album</a>
        <a className="btn btn-ghost" href="./about.html">The story</a>
      </div>
    </SubPage>
  )
}
