/**
 * Icon geometry, resolved once on the server at plugin init.
 *
 * The client `Icon` lazy-loads every lucide icon as its own chunk. That keeps
 * the bundle small, but the server-rendered HTML can only hold an empty box
 * per icon, so on every full page load (a refresh, a fresh tab) the header
 * buttons, sidebar and dashboard cards stayed blank until each chunk arrived —
 * long enough to notice in `next dev`. Every name the panel can draw is known
 * up front (the theme's own chrome + the configured entity icons), so the
 * plugin loads their nodes here and ships them on `admin.custom`; the
 * ThemeProvider seeds the Icon cache before anything renders, and the very
 * first paint already has real icons.
 */

import { type IconNode, iconNodeOf } from './components/Icon/iconNode.js'

export type { IconNode }

/** Every icon the theme's own UI draws by literal name. */
export const THEME_UI_ICONS = [
  'ban',
  'check',
  'chevrons-up-down',
  'circle-user',
  'clipboard',
  'file',
  'keyboard',
  'layout-dashboard',
  'log-out',
  'moon',
  'palette',
  'panel-left-close',
  'panel-left-open',
  'plus',
  'rotate-ccw',
  'search',
  'sun',
  'trending-down',
  'trending-up',
  'x',
]

/**
 * Load the nodes for `names` (deduplicated). Unknown names are skipped — the
 * client falls back to its lazy load, which renders the empty box for them
 * exactly as before.
 */
export async function loadIconNodes(names: string[]): Promise<Record<string, IconNode>> {
  // Imported lazily, by its full file name: lucide-react has no `exports`
  // map, so plain Node ESM (the Payload CLI, seed scripts, tsx) can't resolve
  // the extensionless subpath bundlers accept. And if it fails anyway, the
  // config must still load — the client's lazy icon path takes over.
  let imports: Record<string, (() => Promise<unknown>) | undefined>
  try {
    imports = (await import('lucide-react/dynamicIconImports.mjs')).default as typeof imports
  } catch {
    return {}
  }
  const unique = [...new Set(names)]
  const entries = await Promise.all(
    unique.map(async (name): Promise<[string, IconNode] | null> => {
      const importer = imports[name]
      if (!importer) return null
      try {
        const node = iconNodeOf(await importer())
        return node ? [name, node] : null
      } catch {
        return null
      }
    }),
  )
  return Object.fromEntries(entries.filter((entry) => entry !== null))
}
