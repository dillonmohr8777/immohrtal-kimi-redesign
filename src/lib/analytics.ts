/**
 * Measurement layer. Everything is OFF until an ID is pasted into
 * CONFIG below — no scripts load, zero performance cost. Fill in an ID,
 * commit, and that provider goes live on the next deploy along with all
 * the events already wired through track().
 *
 * Events in use across the site:
 *   preview_play   { track }   a track preview started
 *   gate_open      { source }  the email gate appeared
 *   gate_signup    { source }  someone joined the list (the money event)
 *   epk_download   {}          press kit downloaded
 */

export const CONFIG = {
  /** GA4 measurement id, e.g. 'G-XXXXXXXXXX' */
  GA4_ID: '' as string,
  /** Meta (Facebook) pixel id, e.g. '1234567890' — unlocks retargeting ads */
  META_PIXEL_ID: '' as string,
  /** Plausible domain, e.g. 'immohrtal.com' (privacy-friendly, no banner) */
  PLAUSIBLE_DOMAIN: '' as string,
}

type Props = Record<string, string | number>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    plausible?: (event: string, opts?: { props?: Props }) => void
  }
}

let initialized = false

function loadScript(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v))
  document.head.appendChild(s)
}

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  if (CONFIG.GA4_ID) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA4_ID}`)
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', CONFIG.GA4_ID)
  }

  if (CONFIG.META_PIXEL_ID) {
    /* standard Meta pixel bootstrap, minified */
    const w = window as Window
    if (!w.fbq) {
      const n: any = (w.fbq = function (...args: unknown[]) {
        n.callMethod ? n.callMethod(...args) : n.queue.push(args)
      })
      n.push = n
      n.loaded = true
      n.version = '2.0'
      n.queue = []
      loadScript('https://connect.facebook.net/en_US/fbevents.js')
    }
    w.fbq!('init', CONFIG.META_PIXEL_ID)
    w.fbq!('track', 'PageView')
  }

  if (CONFIG.PLAUSIBLE_DOMAIN) {
    loadScript('https://plausible.io/js/script.manual.js', {
      'data-domain': CONFIG.PLAUSIBLE_DOMAIN,
    })
  }
}

/** Fire a named event to every provider that's configured. Safe no-op otherwise. */
export function track(event: string, props: Props = {}) {
  if (typeof window === 'undefined') return
  try {
    window.gtag?.('event', event, props)
    if (window.fbq) {
      if (event === 'gate_signup') window.fbq('track', 'Lead', props)
      else window.fbq('trackCustom', event, props)
    }
    window.plausible?.(event, { props })
  } catch {
    /* analytics must never break the site */
  }
}
