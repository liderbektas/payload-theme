/**
 * Loads the BUILT plugin with plain Node ESM — no bundler, no TS loader — and
 * runs it over a minimal config. Vitest, `node` scripts and Payload's own CLI
 * load `payload.config.ts` like this, without bundling node_modules, so an
 * extensionless relative import (`./icons`) or a bare deep import into a
 * package without an `exports` map (`next/link`) fails here first.
 *
 * Only the `payload-theme` entry is checked: `/client` and `/rsc` are
 * component modules the Next bundler loads, and `@payloadcms/ui` itself
 * imports CSS, which plain Node cannot load at all.
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const entry = fileURLToPath(new URL('../dist/index.js', import.meta.url))
if (!existsSync(entry)) {
  console.error('check-node-esm: dist/ is missing — run `pnpm build` first.')
  process.exit(1)
}

const { payloadTheme } = await import('payload-theme')
const config = await payloadTheme()({ admin: {}, collections: [], globals: [] })

const providers = config.admin?.components?.providers ?? []
if (!providers.includes('payload-theme/rsc#BootScript')) {
  console.error('check-node-esm: the plugin ran but registered no providers', providers)
  process.exit(1)
}
const icons = Object.keys(config.admin?.custom?.payloadTheme?.iconNodes ?? {}).length
if (!icons) {
  console.error('check-node-esm: no icon geometry loaded (lucide icon map failed to import)')
  process.exit(1)
}
console.log(`check-node-esm: OK — plugin loaded and applied by plain Node (${icons} icons)`)
