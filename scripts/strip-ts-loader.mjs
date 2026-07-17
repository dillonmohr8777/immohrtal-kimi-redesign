/**
 * Minimal ESM loader hook: transpiles .ts imports to ESM via esbuild so
 * scripts/gen-blog-pages.mjs can import src/content/*.ts on any Node
 * version (Node 20 on some build machines, Node 22+ elsewhere). This
 * replaces the Node-22-only `--experimental-strip-types` flag.
 */
import { readFile } from 'node:fs/promises'
import { transformSync } from 'esbuild'

export async function load(url, context, nextLoad) {
  if (url.endsWith('.ts')) {
    const source = await readFile(new URL(url), 'utf8')
    const { code } = transformSync(source, { loader: 'ts', format: 'esm' })
    return { format: 'module', source: code, shortCircuit: true }
  }
  return nextLoad(url, context)
}
