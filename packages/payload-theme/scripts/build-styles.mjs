/**
 * Inlines the `@import './…';` lines of src/styles/theme.css (the module
 * index) into ONE dist/styles/theme.css, in index order.
 *
 * The source tree stays modular so the stylesheet is reviewable on GitHub;
 * consumers keep loading a single flat file — no bundler @import resolution,
 * no extra requests, byte-for-byte the same cascade as a hand-written
 * monolith. Order matters (unlayered overrides last), so the index is the
 * single source of truth for concatenation order.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stylesDir = path.join(pkgRoot, 'src/styles')
const entry = fs.readFileSync(path.join(stylesDir, 'theme.css'), 'utf8')

const missing = []
const inlined = entry.replace(/^@import '\.\/(.+?)';$/gm, (line, rel) => {
  const file = path.join(stylesDir, rel)
  if (!fs.existsSync(file)) {
    missing.push(rel)
    return line
  }
  // trim the module's trailing newline — the entry's own line breaks join them
  return fs.readFileSync(file, 'utf8').replace(/\n$/, '')
})

if (missing.length > 0) {
  console.error(`[build-styles] missing module(s):\n  ${missing.join('\n  ')}`)
  process.exit(1)
}
if (/^@import /m.test(inlined)) {
  console.error('[build-styles] unresolved @import left in output')
  process.exit(1)
}

const outFile = path.join(pkgRoot, 'dist/styles/theme.css')
fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, inlined)
console.log(`[build-styles] wrote ${path.relative(pkgRoot, outFile)} (${inlined.length} bytes)`)
