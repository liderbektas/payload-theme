/**
 * Pull the icon geometry out of a lucide per-icon module.
 *
 * lucide-react renamed the export in a MINOR release: up to 1.41 each icon
 * module exports `__iconNode` (the `[element, attributes][]` array); from 1.42
 * it exports `__iconData`, with that same array under `.node`. The declared
 * `^1.24.0` range resolves either, so both shapes are read. Reading only
 * `__iconNode` left every lazily loaded icon an empty placeholder on 1.42+
 * (issue #10).
 *
 * No `'use client'` and no imports: shared by the server-side preload
 * (`src/icons.ts`) and the client `Icon`'s lazy path.
 */

/** lucide's icon geometry: `[element, attributes][]` — plain, serializable data. */
export type IconNode = Array<[string, Record<string, string>]>

type LucideIconModule = {
  __iconData?: { node?: unknown }
  __iconNode?: unknown
}

export const iconNodeOf = (mod: unknown): IconNode | undefined => {
  if (!mod || typeof mod !== 'object') return undefined
  const { __iconData, __iconNode } = mod as LucideIconModule
  const node = __iconData?.node ?? __iconNode
  return Array.isArray(node) ? (node as IconNode) : undefined
}
