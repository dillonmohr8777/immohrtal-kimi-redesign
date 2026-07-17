/**
 * IndexNow ping: tells Bing (and IndexNow partners) about all site URLs
 * instantly. Bing powers ChatGPT search and Copilot, so this is also an
 * AEO lever. Run after any deploy that adds or changes pages:
 *
 *   node scripts/indexnow-ping.mjs [host]
 *
 * host defaults to the origin in gen-blog-pages.mjs. The IndexNow key
 * file lives in public/<key>.txt (key stored in .indexnow-key).
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const key = readFileSync(resolve(ROOT, '.indexnow-key'), 'utf8').trim()
const gen = readFileSync(resolve(ROOT, 'scripts/gen-blog-pages.mjs'), 'utf8')
const origin = process.argv[2]
  ? `https://${process.argv[2]}`
  : gen.match(/const ORIGIN = '([^']+)'/)[1]
const host = new URL(origin).host

const { posts } = await import(resolve(ROOT, 'src/content/blog.ts'))
const urls = [
  `${origin}/`,
  `${origin}/about.html`,
  `${origin}/video.html`,
  `${origin}/blog.html`,
  `${origin}/contact.html`,
  `${origin}/press.html`,
  ...posts.map((p) => `${origin}/blog/${p.slug}.html`),
]

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `${origin}/${key}.txt`, urlList: urls }),
})
console.log(`IndexNow → ${res.status} ${res.statusText} (${urls.length} URLs for ${host})`)
if (!res.ok) console.log(await res.text())
