import { useState, type FormEvent, type ReactNode } from 'react'
import { artist, contact, socials } from '../content/album'
import { cycleTheme, useAfterHours } from '../hooks/useAfterHours'
import { InstagramIcon, TikTokIcon, XIcon, YouTubeIcon } from './icons'

const socialIcons: Record<string, () => ReactNode> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  x: XIcon,
  youtube: YouTubeIcon,
}

interface FanSignupFormProps {
  source: string
  inputId: string
  className: string
}

export function FanSignupForm({ source, inputId, className }: FanSignupFormProps) {
  const [busy, setBusy] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const email = String(data.get('email') ?? '').trim()
    if (!email) return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'immohrtal-list',
          email,
          source,
          'bot-field': String(data.get('bot-field') ?? ''),
        }).toString(),
      })
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
      if (!res.ok && !isLocal) {
        throw new Error(`form capture failed (${res.status})`)
      }
      form.reset()
      setJoined(true)
    } catch {
      setError("Couldn't join the list right now - try again in a second.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form
        onSubmit={submit}
        className={className}
        name="immohrtal-list"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
      >
        <input type="hidden" name="form-name" defaultValue="immohrtal-list" />
        <p className="hidden" aria-hidden="true">
          <label>
            don't fill this out: <input name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </p>
        <label className="sr-only" htmlFor={inputId}>Email address</label>
        <input id={inputId} name="email" type="email" placeholder="email for drops" required />
        <input type="hidden" name="source" defaultValue={source} />
        <button className="btn btn-chrome" type="submit" disabled={busy}>
          {busy ? 'Joining...' : 'Join list'}
        </button>
      </form>
      {joined && (
        <p className="mono-tag reveal reveal-later mt-4" role="status" style={{ color: 'var(--dim)' }}>
          Joined - watch for drops.
        </p>
      )}
      {error && (
        <p className="mono-tag reveal reveal-later mt-4" role="alert" style={{ color: '#b3261e' }}>
          {error}
        </p>
      )}
    </>
  )
}

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="relative z-10 mx-auto max-w-4xl px-5 py-24 md:py-36 text-center">
      <p className="section-eyebrow reveal justify-center" data-decode="">05 / Contact</p>
      <h2 id="contact-heading" className="font-display chrome-text reveal mt-5 uppercase" style={{ fontSize: 'clamp(2.4rem, 6.5vw, 5rem)', lineHeight: 1 }}>
        Book IMMOHRTAL
      </h2>
      <p className="reveal reveal-late mx-auto mt-5 max-w-md" style={{ color: 'var(--dim)' }}>
        Shows, features, press, and rooms that need bars with weight.
      </p>

      <div className="reveal reveal-late mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a className="btn btn-chrome" href={`mailto:${contact.bookingEmail}`}>
          {contact.bookingEmail}
        </a>
        <a className="btn btn-ghost" href={contact.phoneHref}>
          {contact.phone}
        </a>
      </div>

      <FanSignupForm source="site" inputId="fan-email" className="fan-form reveal reveal-later mx-auto mt-8" />

      <ul className="reveal reveal-later m-0 mt-14 flex list-none flex-wrap items-center justify-center gap-3 p-0">
        {socials.map((s) => {
          const Icon = socialIcons[s.id]
          const inner = (
            <>
              <Icon />
              <span className="font-mono text-[11px] tracking-[0.18em]">{s.handle}</span>
            </>
          )
          return (
            <li key={s.id}>
              {s.href ? (
                <a
                  className="platform-pill !gap-3 !rounded-full !px-5 !py-3 no-underline"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${artist.name} on ${s.label}`}
                >
                  {inner}
                </a>
              ) : (
                <span
                  className="platform-pill is-dead !gap-3 !rounded-full !px-5 !py-3"
                  aria-label={`${s.label} ${s.handle} - link coming soon`}
                  style={{ color: 'var(--dim)' }}
                >
                  {inner}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ThemeToggle() {
  const { mode } = useAfterHours()
  return (
    <button
      type="button"
      className="theme-toggle font-mono text-[11px] uppercase tracking-[0.2em]"
      onClick={cycleTheme}
      aria-label={`Theme: ${mode}. Click to change.`}
    >
      after hours: {mode}
    </button>
  )
}

export function Footer({ base = './' }: { base?: string }) {
  return (
    <footer className="relative z-10 border-t px-5 py-10" style={{ borderColor: 'var(--line)' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span className="font-display chrome-text text-lg uppercase tracking-wide">{artist.name}</span>
        <nav aria-label="Footer" className="flex items-center gap-5">
          {[
            [`${base}index.html`, 'Home'],
            [`${base}about.html`, 'About'],
            [`${base}blog.html`, 'Blog'],
            [`${base}contact.html`, 'Contact'],
            [`${base}press.html`, 'Press'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="font-mono text-[11px] uppercase tracking-[0.2em] no-underline transition-colors hover:text-[#141922]"
              style={{ color: 'var(--faint)' }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--faint)' }}>
            © {new Date().getFullYear()} {artist.name} · recorded after hours
          </span>
        </div>
      </div>
    </footer>
  )
}
