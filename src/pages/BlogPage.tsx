import { posts } from '../content/blog'
import { SubPage } from '../components/SubPage'
import { TiltBox } from '../components/TiltBox'
import { RichText } from '../components/RichText'

export function BlogPage() {
  return (
    <SubPage tone="dark">
      <p className="section-eyebrow reveal" data-decode="">Blog</p>
      <h1
        className="font-display chrome-text reveal mt-5 uppercase"
        style={{ fontSize: 'clamp(2.6rem, 7vw, 5.4rem)', lineHeight: 0.95 }}
      >
        Real rap, real stories, and the sport
      </h1>
      <p className="reveal reveal-late mt-5 max-w-2xl text-[17px] leading-[1.8]" style={{ color: 'var(--dim)' }}>
        Field notes from the build. More chapters land as the record does.
      </p>

      {/* the Erie Underground zine sheet */}
      <div className="reveal reveal-late mt-12 w-full max-w-xl">
        <TiltBox max={4}>
          <figure className="pop-box m-0 block p-3">
            <img
              src="blog-erie.jpg"
              alt="Erie Underground zine page: from the lake, for the world"
              className="block h-auto w-full rounded-xl"
              loading="lazy"
            />
            <figcaption className="mono-tag mt-3 pb-1 text-center">Erie Underground // Vol. 814</figcaption>
          </figure>
        </TiltBox>
      </div>

      <div className="mt-14 flex flex-col gap-8">
        {posts.map((post, i) => (
          <div key={post.slug} className={`reveal-pop ${i % 2 === 1 ? 'reveal-late' : ''}`}>
          <TiltBox max={3}>
          <article id={post.slug} className="blog-card sheen">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="mono-tag" style={{ color: 'var(--signal-txt)' }}>
                  {post.date} / {post.tag}
                </p>
                <h2
                  className="font-display chrome-text mt-3 uppercase"
                  style={{ fontSize: 'clamp(2rem, 4.8vw, 3.6rem)', lineHeight: 0.98 }}
                >
                  {post.title}
                </h2>
              </div>
              <div className="blog-number font-display">{String(i + 1).padStart(2, '0')}</div>
            </div>

            <p className="blog-answer mt-6"><RichText>{post.answer}</RichText></p>

            <div className="mt-8">
              <a className="btn btn-chrome" href={`./blog/${post.slug}.html`}>
                Read the full entry
              </a>
            </div>
          </article>
          </TiltBox>
          </div>
        ))}
      </div>

      <p className="mono-tag reveal mt-10">new entries land as the story unfolds.</p>
    </SubPage>
  )
}
