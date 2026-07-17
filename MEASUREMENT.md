# Measurement: how to turn it on

The site is fully instrumented but dark until you paste IDs into
`src/lib/analytics.ts` (CONFIG at the top). Nothing loads until then,
so there is zero performance or privacy cost while empty.

## Events already firing site-wide once a provider is on

| Event | Meaning |
|---|---|
| `preview_play` | a track preview started (with track title) |
| `gate_open` | the email gate appeared (source: preview or video) |
| `gate_signup` | someone joined the list. THE money event. Maps to Meta "Lead". |
| `epk_download` | press kit downloaded from /press.html |

## Turn-on steps (each is ~2 minutes, in your accounts)

1. **GA4**: analytics.google.com → create property → copy the
   `G-XXXXXXXXXX` measurement id → paste into `GA4_ID`.
2. **Meta Pixel** (unlocks retargeting ads): Meta Events Manager →
   Data sources → your pixel → copy the numeric id → paste into
   `META_PIXEL_ID`. `gate_signup` arrives as a standard **Lead** event,
   so you can optimize ad delivery on it directly.
3. **Plausible** (optional, privacy-friendly, paid): add the site,
   paste the domain into `PLAUSIBLE_DOMAIN`.
4. **Google Search Console**: search.google.com/search-console → add
   property → HTML tag method → send Claude the
   `google-site-verification` content value (safe to share) and it goes
   into index.html. Then submit `sitemap.xml`. Same flow for Bing
   Webmaster Tools.

Commit after pasting, the deploy makes it live. When the custom domain
lands, update `ORIGIN` in `scripts/gen-blog-pages.mjs` and the canonical
URLs in the html heads, everything else follows automatically.
