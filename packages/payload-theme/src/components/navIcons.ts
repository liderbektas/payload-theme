import type { ResolvedThemeConfig } from '../options'

/**
 * Resolve the lucide icon name for an entity slug: the user's `nav.icons` map
 * first, then the configured fallback. Shared by the Nav and the Dashboard so
 * both always render the same icon for a given entity.
 */
export function resolveIconName(theme: ResolvedThemeConfig | undefined, slug: string): string {
  return theme?.nav?.icons?.[slug] ?? theme?.fallbackIconName ?? 'folder'
}
