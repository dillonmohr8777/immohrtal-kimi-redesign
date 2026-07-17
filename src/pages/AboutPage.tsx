import { artist, markings, story } from '../content/album'
import { SubPage } from '../components/SubPage'
import { TiltBox } from '../components/TiltBox'

export function AboutPage() {
  return (
    <SubPage>
      <p className="section-eyebrow reveal" data-decode="">About</p>
      <h1 className="font-display chrome-text reveal mt-5 uppercase" style={{ fontSize: 'clamp(2.6rem, 7vw, 5rem)', lineHeight: 1 }}>
        {artist.name}
      </h1>
      <p className="font-serif italic reveal reveal-late mt-4" style={{ fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', color: 'var(--ink)' }}>
        {artist.albumTitle}
      </p>

      <blockquote
        className="font-serif italic reveal reveal-late mt-10 border-l-2 pl-6"
        style={{ fontSize: 'clamp(1.3rem, 3vw, 1.9rem)', lineHeight: 1.35, borderColor: 'var(--signal)', color: 'var(--ink)', margin: '2.5rem 0 0' }}
      >
        "{story.pullQuote}"
      </blockquote>

      {/* editorial portrait */}
      <div className="reveal reveal-late mt-12 w-full max-w-md">
        <TiltBox max={5}>
          <figure className="pop-box m-0 block p-3">
            <img
              src="about-portrait.jpg"
              alt={`Dillon Mohr, ${artist.name}`}
              className="block h-auto w-full rounded-xl"
              loading="lazy"
            />
            <figcaption className="mono-tag mt-3 pb-1 text-center">Dillon Mohr // {artist.name}</figcaption>
          </figure>
        </TiltBox>
      </div>

      <div className="mt-10 flex flex-col gap-6">
        {story.paragraphs.map((p, i) => (
          <p key={i} className={`reveal ${i > 0 ? 'reveal-late' : ''} m-0 max-w-2xl text-[16.5px] leading-[1.8]`} style={{ color: 'var(--dim)' }}>
            {p}
          </p>
        ))}
        <p className="reveal reveal-late m-0 max-w-2xl text-[16.5px] leading-[1.8]" style={{ color: 'var(--dim)' }}>
          At 28, he's old enough to know attention is earned and young enough to still attack every verse like the first real shot. The marketing officer knows how to build the frame. The rapper knows the frame means nothing if the line doesn't hold.
        </p>
        <p className="reveal reveal-late m-0 max-w-2xl text-[16.5px] leading-[1.8]" style={{ color: 'var(--dim)' }}>
          Having my daughter Stella changed the reason behind all of it. She made me want to finally release and polish the older music instead of leaving it buried. She made me care about shit outside of marketing again, about building a healthy family, growing the right way, and going as hard as possible because the work means more than attention now.
        </p>
        <p className="reveal reveal-late m-0 max-w-2xl text-[16.5px] leading-[1.8]" style={{ color: 'var(--dim)' }}>
          That fire brought the passion back. The bar is Nas, Hov, Big L, Isaiah Rashad, K-Dot, Lil Wayne, and Paul Wall: pens with identity, detail, feeling, and replay value. Not copying them. Just aiming at the same kind of standard.
        </p>
      </div>

      <p className="mono-tag reveal mt-14">The three markings</p>
      <ol className="m-0 mt-5 grid list-none gap-4 p-0 sm:grid-cols-3">
        {markings.map((m, i) => (
          <li key={m.numeral} className={`reveal-pop ${i === 1 ? 'reveal-late' : i === 2 ? 'reveal-later' : ''}`}>
            <TiltBox max={8} className="h-full">
            <span className="marking-card sheen block h-full rounded-2xl p-6">
            <span className="font-display chrome-text-light block text-4xl" aria-hidden="true">{m.numeral}</span>
            <span className="mt-3 block font-body text-[16px] font-medium">{m.label}</span>
            <span className="mono-tag mt-1 block" style={{ color: 'var(--signal-txt)' }}>{m.coord}</span>
            <span className="mt-3 block text-[14px] leading-relaxed" style={{ color: 'var(--dim)' }}>{m.line}</span>
            </span>
            </TiltBox>
          </li>
        ))}
      </ol>

      <div className="reveal reveal-later mt-14 flex flex-col gap-4 sm:flex-row">
        <a className="btn btn-chrome" href="./index.html#listen">Hear the album</a>
        <a className="btn btn-ghost" href="./blog.html">Read the blog</a>
      </div>
    </SubPage>
  )
}
