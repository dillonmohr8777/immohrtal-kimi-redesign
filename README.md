# IMMOHRTAL — Dance With The Delusional

Kimi redesign preview: this is intentionally isolated from the original IMMOHRTAL site. It includes the added press, video, blog, and EPK surfaces. Unreleased audio and IndexNow credentials are excluded; the preview video is muted.

Live preview: https://immohrtal-kimi-redesign.netlify.app

Official artist site for **IMMOHRTAL**. One page, six sections, and a
WebGL "spine" you ride down as you scroll — the same engine as the
Mohr Media site, re-themed to the album world: white paper background,
gunmetal metal from the logo, blue-to-green particle descent, and a
studio-session HUD (`TRK 02 · MONITORS · LEVELS 043.1%`).

Built with React 19 + Vite + TypeScript + Tailwind v4. The 3D world is
raw WebGL (ported from `mohr-media-site/assets/spine.js`) — **zero
runtime dependencies beyond React**, ~78 KB gzipped total JS.

## Run it locally

```bash
cd immohrtal-site
npm install
npm run dev        # dev server → http://localhost:5173
```

Production build + preview:

```bash
npm run build      # typecheck + build → dist/
npm run preview    # serve the build → http://localhost:4173
```

Deploy: `dist/` is fully static — drop it on any static host
(Netlify, Vercel, Cloudflare Pages, S3).

## Where to swap in the real assets

Everything editable lives in **`src/content/album.ts`** — titles, links,
copy, emails. The suggested track titles are placeholders; nothing is
final until you change them.

| Asset | Where it goes | Then |
|---|---|---|
| **Album audio (MP3s)** | `public/audio/` (e.g. `01-signal.mp3`) | Set each track's `src` in `src/content/album.ts` (e.g. `'/audio/01-signal.mp3'`). Play buttons, sticky player, and the audio-reactive spine + visualizer light up automatically. |
| **Cover art** | `public/cover.jpg` | Set `artist.coverArt = '/cover.jpg'`. Until then a generated placeholder cover renders. |
| **Logo** | Already wired: `public/logo.jpg` renders in the hero box, nav, and loader | Swap the file to update it everywhere at once. |
| **Artist photo (hero)** | `public/artist.jpg` | Set `artist.heroImage = '/artist.jpg'`. It renders huge under the hero lockup with the hover pop (Mac Miller style). |
| **Streaming links** | — | Fill the `href` for Spotify / Apple Music / YouTube / SoundCloud / Pre-Save (DistroKid hyperfollow) in `platforms`. A `null` href shows the platform as "SOON". |
| **Socials + booking** | — | Swap the `@immohrtal` handles and `booking@` / `press@` emails in `socials` / `contact`. |

## The spine (WebGL world)

- `src/spine/` — engine, geometry, shaders, config. Six "stations"
  along the descent, one per section: chrome orb → vinyl disc →
  waveform grid → chain-link knot → speaker cone → transmission beacons.
- Playing audio feeds a live energy uniform into the world (the
  waveform grid amplitude pulses with the track).
- Waypoint labels / section order: `src/spine/config.ts`.
- Palette: `SPINE_PALETTE` in the same file + CSS tokens at the top of
  `src/index.css`.
- **Reduced motion / no WebGL** → static gradient fallback, no loader,
  everything still readable. Adaptive governor downgrades DPR → bloom →
  point count on slow devices.
- Dev note: headless browsers/VMs reject hardware-quality WebGL; append
  `?forcegl` to the URL to accept software rendering when testing.

## Accessibility

Contrast-checked tokens (AA), keyboard-focus styles everywhere,
`aria-hidden` on all decorative canvases, labeled rail/play controls,
`prefers-reduced-motion` respected across loader, grain, marquee,
reveals, and the GL world.
