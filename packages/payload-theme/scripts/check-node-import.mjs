/**
 * Imports the built plugin entry (dist/index.js) with plain Node ESM.
 *
 * Bundlers (Next.js), tsx and Vitest's handling of workspace packages all
 * resolve extensionless specifiers, so a missing `.js` in an import only
 * shows up for consumers that load the package with plain Node: Vitest in a
 * consuming app, the Payload CLI, seed scripts. This keeps that path working.
 *
 * The `./client` and `./rsc` entries are left out on purpose: they import
 * @payloadcms/ui, which itself only loads under a bundler (it imports CSS).
 */
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const entry = path.join(pkgRoot, 'dist/index.js')

try {
  const mod = await import(pathToFileURL(entry).href)
  if (typeof mod.payloadTheme !== 'function') {
    throw new Error('dist/index.js does not export payloadTheme()')
  }
  console.log('[check-node-import] dist/index.js imports under plain Node ESM')
} catch (error) {
  console.error('[check-node-import] dist/index.js cannot be imported by plain Node ESM:')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
