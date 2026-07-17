/**
 * The list: one capture path that works on ANY host.
 *
 * Submissions always land in Netlify Forms (immohrtal-list) on the
 * Netlify site, which stays alive as the form backend + contact store
 * even when the site is served from Vercel or a custom domain.
 *
 * Same-origin (on Netlify): normal POST, real status.
 * Cross-origin (Vercel, localhost, future domain): POST with no-cors.
 * The response is opaque there, so we optimistically treat it as
 * delivered; Netlify still records it and fires the Gmail notification.
 *
 * RULE: do not delete the Netlify site while this is the backend.
 */
const FORM_BACKEND = 'https://immohrtal-site.netlify.app'

export async function submitToList(fields: Record<string, string>): Promise<void> {
  const body = new URLSearchParams({ 'form-name': 'immohrtal-list', ...fields }).toString()
  const sameHost = window.location.origin === FORM_BACKEND
  const res = await fetch(sameHost ? '/' : `${FORM_BACKEND}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    ...(sameHost ? {} : { mode: 'no-cors' as RequestMode }),
    body,
  })
  if (sameHost && !res.ok) throw new Error(`form capture failed (${res.status})`)
}
