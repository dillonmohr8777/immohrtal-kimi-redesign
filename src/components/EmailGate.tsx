import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { tracks } from '../content/album'
import { usePlayer } from '../audio/PlayerContext'
import { track } from '../lib/analytics'
import { submitToList } from '../lib/list'

/**
 * Email gate for the track previews. First play prompts for a newsletter
 * signup (captured by Netlify Forms, see the hidden `immohrtal-list` form
 * in index.html); once on the list, previews stay unlocked on this device.
 */

const STORAGE_KEY = 'immohrtal.list'

interface GateState {
  unlocked: boolean
  /** play a track if unlocked, otherwise open the signup gate for it */
  requestPlay: (index: number) => void
}

const GateContext = createContext<GateState | null>(null)

export function useGate() {
  const ctx = useContext(GateContext)
  if (!ctx) throw new Error('useGate must be used inside <EmailGateProvider>')
  return ctx
}

function readUnlocked(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function EmailGateProvider({ children }: { children: ReactNode }) {
  const { playTrack } = usePlayer()
  const [unlocked, setUnlocked] = useState(readUnlocked)
  const [pending, setPending] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const requestPlay = useCallback(
    (index: number) => {
      if (unlocked) {
        playTrack(index)
        return
      }
      setPending(index)
      setError(null)
      setOpen(true)
      track('gate_open', { source: 'preview' })
    },
    [unlocked, playTrack],
  )

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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
        source: pending != null ? `preview gate, ${tracks[pending].title}` : 'preview gate',
        'bot-field': String(data.get('bot-field') ?? ''),
      })
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* private mode, session-only unlock */
      }
      track('gate_signup', { source: 'preview' })
      setUnlocked(true)
      setOpen(false)
      if (pending != null) playTrack(pending)
    } catch {
      setError("Couldn't reach the list right now, try again in a second.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <GateContext.Provider value={{ unlocked, requestPlay }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-heading"
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(11, 15, 21, 0.72)', backdropFilter: 'blur(6px)' }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-md border p-8 md:p-10"
            style={{
              background: '#f7f9fb',
              color: '#141922',
              borderColor: 'rgba(20, 25, 34, 0.25)',
              boxShadow: '0 40px 90px rgba(0, 0, 0, 0.5)',
            }}
          >
            <p className="mono-tag" style={{ color: '#0d6bcc' }}>
              THE LIST // FIRST LISTENS
            </p>
            <h3
              id="gate-heading"
              className="font-display mt-4 uppercase"
              style={{ fontSize: 'clamp(1.9rem, 5vw, 2.6rem)', lineHeight: 0.98 }}
            >
              Unlock the previews.
            </h3>
            <p className="mt-4 text-[15px]" style={{ color: 'rgba(20, 25, 34, 0.72)' }}>
              Seven tracks, thirty seconds each, before anyone else hears them.
              Drop your email and the previews open right here. Release updates
              only, no spam. If not now, when?
            </p>
            <form onSubmit={submit} className="mt-6">
              <p className="hidden" aria-hidden="true">
                <label>
                  don&rsquo;t fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" />
                </label>
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  ref={inputRef}
                  type="email"
                  name="email"
                  required
                  placeholder="you@wherever.com"
                  autoComplete="email"
                  className="w-full border bg-white px-4 py-3 font-mono text-[13px] outline-none"
                  style={{ borderColor: 'rgba(20, 25, 34, 0.3)', color: '#141922' }}
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="mono-tag shrink-0 cursor-pointer border-0 px-6 py-3"
                  style={{ background: '#141922', color: '#f7f9fb', opacity: busy ? 0.6 : 1 }}
                >
                  {busy ? 'UNLOCKING…' : 'UNLOCK //'}
                </button>
              </div>
              {error && (
                <p className="mono-tag mt-3" role="alert" style={{ color: '#b3261e' }}>
                  {error}
                </p>
              )}
            </form>
            <p className="mono-tag mt-6" style={{ color: 'rgba(20, 25, 34, 0.45)' }}>
              SESSION 001 &middot; DANCE WITH THE DELUSIONAL
            </p>
            <button
              type="button"
              className="mono-tag absolute right-4 top-4 cursor-pointer border-0 bg-transparent p-2"
              style={{ color: 'rgba(20, 25, 34, 0.55)' }}
              onClick={() => setOpen(false)}
              aria-label="Close signup"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </GateContext.Provider>
  )
}
