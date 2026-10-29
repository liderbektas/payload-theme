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

import dynamicIconImports from 'lucide-react/dynamicIconImports'

/** lucide's icon geometry: `[element, attributes][]` — plain, serializable data. */
export type IconNode = Array<[string, Record<string, string>]>

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
 * The geometry of one lucide per-icon module. lucide-react renamed the export
 * in a minor release — `__iconNode` up to 1.41, `__iconData.node` from 1.42 —
 * and the `^1.24.0` range resolves either, so both shapes are read.
 */
const nodeOf = (mod: unknown): IconNode | undefined => {
  const candidate =
    (mod as { __iconData?: { node?: unknown } } | undefined)?.__iconData?.node ??
    (mod as { __iconNode?: unknown } | undefined)?.__iconNode
  return Array.isArray(candidate) ? (candidate as IconNode) : undefined
}

/**
 * Load the nodes for `names` (deduplicated). Unknown names are skipped — the
 * client falls back to its lazy load, which renders the empty box for them
 * exactly as before.
 */
export async function loadIconNodes(names: string[]): Promise<Record<string, IconNode>> {
  const imports = dynamicIconImports as Record<string, (() => Promise<unknown>) | undefined>
  const unique = [...new Set(names)]
  const entries = await Promise.all(
    unique.map(async (name): Promise<[string, IconNode] | null> => {
      const importer = imports[name]
      if (!importer) return null
      try {
        const node = nodeOf(await importer())
        return node ? [name, node] : null
      } catch {
        return null
      }
    }),
  )
  return Object.fromEntries(entries.filter((entry) => entry !== null))
}
