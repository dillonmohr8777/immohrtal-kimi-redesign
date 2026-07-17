/**
 * One-command domain switch. Run AFTER the new domain is attached to
 * the Netlify site and resolving:
 *
 *   node scripts/set-domain.mjs immohrtal.net
 *
 * Rewrites the site origin everywhere it is baked in (canonicals, OG
 * URLs, JSON-LD ids, sitemap/feed origin, robots, llms.txt), then
 * `npm run build` regenerates blog pages + sitemap + feed on the new
 * origin. Commit and push to deploy.
 *
 * NOTE: src/lib/list.ts (FORM_BACKEND) is intentionally NOT rewritten:
 * form capture keeps posting to the immohrtal-site.netlify.app backend,
 * which continues to work from the custom domain.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const domain = process.argv[2]
if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
  console.error('usage: node scripts/set-domain.mjs <domain>  e.g. immohrtal.net')
  process.exit(1)
}
const NEW = `https://${domain}`
const OLD = 'https://immohrtal-site.netlify.app'

const FILES = [
  'index.html',
  'about.html',
  'blog.html',
  'contact.html',
  'video.html',
  'press.html',
  'public/robots.txt',
  'public/llms.txt',
  'scripts/gen-blog-pages.mjs',
]

let changed = 0
for (const f of FILES) {
  const p = resolve(ROOT, f)
  let t
  try {
    t = readFileSync(p, 'utf8')
  } catch {
    continue
  }
  if (t.includes(OLD)) {
    writeFileSync(p, t.replaceAll(OLD, NEW))
    const n = t.split(OLD).length - 1
    changed += n
    console.log(`${f}: ${n} URL(s) → ${domain}`)
  }
}
console.log(`\n${changed} URLs repointed. Now: npm run build, commit, push.`)
console.log('Then re-run scripts/indexnow-ping.mjs and update Search Console to the new property.')
