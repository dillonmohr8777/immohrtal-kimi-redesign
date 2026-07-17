import { artist, contact, socials } from '../content/album'
import { SubPage } from '../components/SubPage'
import { TiltBox } from '../components/TiltBox'
import { FanSignupForm } from '../components/Contact'
import { InstagramIcon, TikTokIcon, XIcon, YouTubeIcon } from '../components/icons'

const socialIcons: Record<string, () => React.ReactNode> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  x: XIcon,
  youtube: YouTubeIcon,
}

export function ContactPage() {
  return (
    <SubPage>
      <p className="section-eyebrow reveal" data-decode="">Contact</p>
      <h1 className="font-display chrome-text reveal mt-5 uppercase" style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)', lineHeight: 1 }}>
        Book IMMOHRTAL
      </h1>
      <p className="reveal reveal-late mt-5 max-w-md" style={{ color: 'var(--dim)' }}>
        Shows, features, press, and rooms that need bars with weight.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <a className="platform-pill reveal reveal-late no-underline" href={`mailto:${contact.bookingEmail}`}>
          <span className="platform-icon grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: 'var(--line-strong)' }} aria-hidden="true">
            @
          </span>
          <span className="min-w-0 flex-1">
            <span className="mono-tag block">Email</span>
            <span className="block truncate font-body text-[16px] font-medium">{contact.bookingEmail}</span>
          </span>
        </a>
        <a className="platform-pill reveal reveal-late no-underline" href={contact.phoneHref}>
          <span className="platform-icon grid h-11 w-11 shrink-0 place-items-center rounded-full border" style={{ borderColor: 'var(--line-strong)' }} aria-hidden="true">
            TEL
          </span>
          <span className="min-w-0 flex-1">
            <span className="mono-tag block">Phone</span>
            <span className="block font-body text-[16px] font-medium">{contact.phone}</span>
          </span>
        </a>
      </div>

      <FanSignupForm source="contact-page" inputId="contact-fan-email" className="fan-form reveal reveal-later mt-8" />

      {/* press sheets */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <div className="reveal">
          <TiltBox max={5}>
            <figure className="pop-box m-0 block p-3">
              <img
                src="contact-citylines.jpg"
                alt="City Lines press sheet: Erie to Pittsburgh, from the lake to the Burgh"
                className="block h-auto w-full rounded-xl"
                loading="lazy"
              />
              <figcaption className="mono-tag mt-3 pb-1 text-center">814 → 412 // from the lake to the Burgh</figcaption>
            </figure>
          </TiltBox>
        </div>
        <div className="reveal reveal-late">
          <TiltBox max={5}>
            <figure className="pop-box m-0 block p-3">
              <img
                src="contact-press.jpg"
                alt="IMMOHRTAL Dance With The Delusional press artwork"
                className="block h-auto w-full rounded-xl"
                loading="lazy"
              />
              <figcaption className="mono-tag mt-3 pb-1 text-center">Session 001 // the record</figcaption>
            </figure>
          </TiltBox>
        </div>
      </div>

      <p className="mono-tag reveal reveal-late mt-14">Find {artist.name}</p>
      <ul className="m-0 mt-4 flex list-none flex-wrap gap-3 p-0">
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
                <a className="platform-pill !gap-3 !rounded-full !px-5 !py-3 no-underline" href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${artist.name} on ${s.label}`}>
                  {inner}
                </a>
              ) : (
                <span className="platform-pill is-dead !gap-3 !rounded-full !px-5 !py-3" aria-label={`${s.label} ${s.handle} - link coming soon`} style={{ color: 'var(--dim)' }}>
                  {inner}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </SubPage>
  )
}
