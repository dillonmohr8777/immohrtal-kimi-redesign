import { SubPage } from '../components/SubPage'
import { TiltBox } from '../components/TiltBox'
import { contact } from '../content/album'
import { track } from '../lib/analytics'

const FACTS: Array<[string, string]> = [
  ['Artist', 'IMMOHRTAL'],
  ['Real name', 'Dillon Mohr'],
  ['From', 'Erie, PA (the 814)'],
  ['Based in', 'Pittsburgh, PA'],
  ['Day role', 'Chief Marketing Officer'],
  ['Debut album', 'Dance With The Delusional, 11 tracks'],
  ['Features', 'King Keev (814 Blood, On My Way), Ted Moon (title track)'],
  ['Genre', 'Lyrical, storytelling, underground rap'],
  ['Primary influence', 'Mac Miller'],
]

const PHOTOS: Array<[string, string]> = [
  ['press/photo-portrait.jpg', 'Studio portrait, black and white'],
  ['press/photo-lotus.jpg', 'Erie to Pittsburgh newsprint lotus'],
  ['press/photo-814.jpg', '814 lighthouse collage'],
  ['press/photo-family.jpg', 'With his daughter, newsprint collage'],
]

export function PressPage() {
  return (
    <SubPage tone="dark">
      <p className="section-eyebrow reveal" data-decode="">Press</p>
      <h1
        className="font-display chrome-text reveal mt-5 uppercase"
        style={{ fontSize: 'clamp(2.4rem, 6.5vw, 4.8rem)', lineHeight: 0.98 }}
      >
        Everything you need to cover this
      </h1>
      <p className="reveal reveal-late mt-5 max-w-2xl text-[17px] leading-[1.8]" style={{ color: 'var(--dim)' }}>
        The short version: a chief marketing officer from Erie, PA quietly made
        a rap album and decided almost 29 was exactly the right time to put it
        out. Photos, the press kit, and the facts are below. For anything else,
        just ask.
      </p>

      <div className="reveal reveal-late mt-10 flex flex-col gap-4 sm:flex-row">
        <a className="btn btn-chrome" href="press/IMMOHRTAL-EPK.pdf" download onClick={() => track('epk_download')}>
          Download the press kit (PDF)
        </a>
        <a className="btn btn-ghost" href={`mailto:${contact.bookingEmail}`}>
          {contact.bookingEmail}
        </a>
      </div>

      <section className="mt-16" aria-labelledby="press-facts">
        <h2 id="press-facts" className="font-display chrome-text uppercase" style={{ fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)' }}>
          The facts
        </h2>
        <dl className="mt-6 grid max-w-2xl grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
          {FACTS.map(([k, v]) => (
            <div key={k} className="border-b pb-2" style={{ borderColor: 'var(--line)' }}>
              <dt className="mono-tag" style={{ color: 'var(--signal-txt)' }}>{k}</dt>
              <dd className="m-0 mt-1 text-[15px]">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16" aria-labelledby="press-photos">
        <h2 id="press-photos" className="font-display chrome-text uppercase" style={{ fontSize: 'clamp(1.6rem, 3.6vw, 2.4rem)' }}>
          Photos, click to open full size
        </h2>
        <p className="mono-tag mt-3">approved for editorial use with credit: IMMOHRTAL</p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PHOTOS.map(([src, alt]) => (
            <TiltBox key={src} max={3}>
              <a href={src} target="_blank" rel="noopener noreferrer" className="pop-box block p-3">
                <img src={src} alt={alt} loading="lazy" className="block h-auto w-full rounded-xl" />
                <span className="mono-tag mt-3 block pb-1 text-center">{alt}</span>
              </a>
            </TiltBox>
          ))}
        </div>
      </section>

      <div className="reveal reveal-later mt-16 flex flex-col gap-4 sm:flex-row">
        <a className="btn btn-chrome" href="./index.html#listen">Hear the previews</a>
        <a className="btn btn-ghost" href="./about.html">The full story</a>
        <a className="btn btn-ghost" href="./video.html">The official video</a>
      </div>
    </SubPage>
  )
}
