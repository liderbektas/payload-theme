/**
 * Pull the icon geometry out of a lucide per-icon module, split out of the
 * component so it can be unit-tested without a React tree.
 *
 * lucide-react renamed the export in a minor release: up to 1.41 each icon
 * module exports `__iconNode` (the `[element, attributes][]` array); from 1.42
 * it exports `__iconData`, with that same array under `.node`. The declared
 * `^1.24.0` range resolves either, so both shapes must be read — reading only
 * `__iconNode` left every icon an empty placeholder on 1.42+ (#10).
 */

/** lucide's icon geometry: `[element, attributes][]`. */
export type IconNodeData = [string, Record<string, unknown>][]

type LucideIconModule = {
  __iconData?: { node?: unknown }
  __iconNode?: unknown
}

export const iconNodeOf = (mod: unknown): IconNodeData | undefined => {
  if (!mod || typeof mod !== 'object') return undefined
  const { __iconData, __iconNode } = mod as LucideIconModule
  const node = __iconNode ?? __iconData?.node
  return Array.isArray(node) ? (node as IconNodeData) : undefined
}
