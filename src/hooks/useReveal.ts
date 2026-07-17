import { useEffect } from 'react'

/** Glyph-scramble "decode" for [data-decode] labels (from the Mohr
 *  spine) — text resolves left to right over 600ms. */
function decode(el: HTMLElement) {
  const final = el.textContent ?? ''
  if (!final.trim()) return
  const GLYPHS = '01/·|:×+'
  const t0 = performance.now()
  const DUR = 600
  el.setAttribute('aria-label', final)
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / DUR)
    const solved = Math.floor(final.length * p)
    let out = final.slice(0, solved)
    for (let i = solved; i < final.length; i++) {
      out += final[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
    }
    el.textContent = out
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

/**
 * Scroll-reveal: adds .is-visible to every .reveal element as it
 * enters the viewport. One observer for the whole page. Elements
 * carrying data-decode also run the glyph scramble on entry.
 */
export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal, .reveal-pop'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const reduced = prefersReducedMotion()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            if (!reduced && entry.target instanceof HTMLElement && entry.target.dataset.decode !== undefined) {
              decode(entry.target)
            }
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
