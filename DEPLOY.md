# Hosting

This isolated Kimi redesign has its own Netlify project and form backend.
It must remain separate from the original IMMOHRTAL site and repository.

⚠ **RULE: do not repoint this preview at the original IMMOHRTAL site.**
The Kimi redesign owns its own preview, forms, and deployment pipeline.

## Deploy on Vercel (one time)

1. vercel.com → **Add New → Project** → import `dillonmohr8777/immohrtal-kimi-redesign`.
2. **Root Directory**: `/`. Framework preset: **Vite**
   (build `npm run build`, output `dist`, auto-detected).
3. Deploy. Every push to `main` then redeploys automatically.

## Fastest path (no git wiring): Netlify Drop

1. `npm run build` (or grab the dist zip Claude sends you).
2. Go to **app.netlify.com/drop** and drag the `dist/` folder in.
3. Live in ~30 seconds. Forms are auto-detected from the built HTML.

## Proper path (auto-deploys on merge)

1. Use the existing Netlify project `immohrtal-kimi-redesign`.
2. Build with `npm run build` and publish `dist`.
3. Pushes to `main` redeploy this isolated preview automatically.

## Custom domain (whenever you buy one)

Project → Settings → Domains → add `immohrtal.com` (or whatever you
pick) and follow the DNS instructions. Then update the `og:image` and
JSON-LD `image` in `index.html` to the absolute URL
(`https://yourdomain.com/og.png`) so link previews are bulletproof.

## Alternative host

The `dist/` folder after `npm run build` is fully static. Drag-and-drop
it into Netlify Drop, Cloudflare Pages, or any static host and it just
works.

## Newsletter gate (Netlify Forms)

Track previews are email-gated: first play opens a signup modal that
POSTs to the hidden `immohrtal-list` form in `index.html`. Netlify
detects that form at deploy time — no config needed, but check:

1. Netlify dashboard → **Forms** → enable form detection (one-time).
2. Submissions appear under Forms → `immohrtal-list`, with the track
   that triggered the signup in the `source` field. **Export CSV** from
   that screen any time — that's the master contact list.
3. Forms → Form notifications → **Add notification → Email** →
   `dillonmohr8777@gmail.com`. Every signup then lands in that inbox
   in real time (email + which track hooked them).
4. To email the list from Gmail: export the CSV, paste addresses into
   **BCC** from dillonmohr8777@gmail.com. Fine up to a few hundred
   contacts (Gmail caps ~500 recipients/day); past that, import the
   CSV into Mailchimp/ConvertKit and send from there.

Unlock state is per-device (`localStorage: immohrtal.list`). Free tier
covers 100 submissions/month — upgrade or move to a mailer API if the
list outgrows it.
