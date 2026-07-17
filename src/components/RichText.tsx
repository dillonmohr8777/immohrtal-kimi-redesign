import type { ReactNode } from 'react'

/**
 * Renders a string with inline markdown links: [anchor](url).
 * Internal links (./ ../ / or #) stay in-tab; external links open in a
 * new tab with rel="noopener". Everything else passes through as text.
 */
const LINK = /\[([^\]]+)\]\(([^)]+)\)/g

export function RichText({ children }: { children: string }): ReactNode {
  const text = children
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  LINK.lastIndex = 0
  let k = 0
  while ((m = LINK.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const [, label, url] = m
    const external = /^https?:\/\//.test(url)
    out.push(
      <a
        key={k++}
        className="blog-link"
        href={url}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}
