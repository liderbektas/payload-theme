import type { LucideIcon } from 'lucide-react'

import {
  Folder,
  Image,
  LayoutDashboard,
  Newspaper,
  Settings,
  Tag,
  Users,
} from 'lucide-react'

/**
 * Maps a collection/global slug to its icon, shared by the Nav sidebar and
 * the Dashboard cards so both always show the same icon for an entity.
 * Edit this object to change icons; unknown slugs fall back to `fallbackIcon`.
 * (Becomes a plugin option — `nav.icons` — in Phase 5 of the package.)
 */
export const navIconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  media: Image,
  posts: Newspaper,
  settings: Settings,
  tags: Tag,
  users: Users,
}

export const fallbackIcon: LucideIcon = Folder
