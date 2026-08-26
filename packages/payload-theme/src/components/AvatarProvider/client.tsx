'use client'

import React from 'react'

/**
 * What the (server) AvatarProvider resolved for the current user:
 * an image URL, a server-rendered node from `admin.avatar.Component`, or
 * neither — in which case the UserMenu draws its initials circle.
 */
export type ThemeAvatar = {
  /** Server-rendered `admin.avatar.Component` output, if any. */
  node: React.ReactNode
  /** Image URL (gravatar, or the configured user field), if any. */
  src: null | string
}

const EMPTY: ThemeAvatar = { node: null, src: null }

const AvatarContext = React.createContext<ThemeAvatar>(EMPTY)

/**
 * Client half of the avatar plumbing. Resolving the avatar needs the server
 * (a DB lookup for upload fields, `RenderServerComponent` for a custom
 * component), but the user block that shows it is a client component — so the
 * server provider hands the result down through this context.
 */
export const ThemeAvatarProvider: React.FC<{
  children?: React.ReactNode
  value: ThemeAvatar
}> = ({ children, value }) => (
  <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>
)

/**
 * The resolved avatar for the logged-in user. Returns `{ node: null, src:
 * null }` when nothing is configured — or when the provider isn't registered
 * yet (an import map generated before this version), so the user block keeps
 * rendering initials instead of breaking.
 */
export const useThemeAvatar = (): ThemeAvatar => React.useContext(AvatarContext)
