import type { ServerProps } from 'payload'

import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import React from 'react'

import type { ResolvedThemeConfig } from '../../options'

import { ThemeAvatarProvider } from './client'
import { gravatarURL, resolveFieldAvatar } from './resolve'

/**
 * Resolves the user avatar once per request and hands it to the client user
 * blocks (sidebar + header) through context.
 *
 * A SERVER component on purpose — every source needs the server:
 *  - `avatar: { field }` may point at an upload relationship that arrives on
 *    `req.user` as a bare ID (Payload's auth depth is 0 by default), so the
 *    related doc has to be fetched — access-controlled — for its URL.
 *  - Payload's own `admin.avatar: { Component }` is a `PayloadComponent`
 *    path only `RenderServerComponent` + the import map can resolve.
 *
 * Registered in `admin.components.providers`, where Payload hands providers
 * the full server props (`payload`, `user`, `i18n`, `permissions`).
 *
 * With nothing configured this does no work at all — no fetch, no render —
 * and the user block draws its accent initials circle as before.
 */
export const AvatarProvider = async ({
  children,
  i18n,
  payload,
  permissions,
  user,
}: { children?: React.ReactNode } & ServerProps) => {
  const theme = payload?.config?.admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined
  // The theme's `avatar` option wins; with it omitted, Payload's own
  // `admin.avatar` decides; with neither, the user block keeps its initials.
  const configured = theme?.avatar ?? null
  const native = payload?.config?.admin?.avatar

  let node: React.ReactNode = null
  let src: null | string = null

  const email = typeof user?.email === 'string' ? user.email : ''

  if (configured?.type === 'field') {
    if (user) src = await resolveFieldAvatar(payload, user, configured)
  } else if (configured?.type === 'gravatar') {
    if (email) src = await gravatarURL(email)
  } else if (configured === null) {
    if (native === 'gravatar') {
      if (email) src = await gravatarURL(email)
    } else if (user && native && typeof native === 'object' && native.Component) {
      // Only with a user: the login view renders no user block, and a custom
      // component is entitled to assume there's someone to draw.
      node = RenderServerComponent({
        Component: native.Component,
        importMap: payload.importMap,
        serverProps: { i18n, payload, permissions, user },
      })
    }
  }
  // `configured.type === 'initials'` falls through on purpose: it is the
  // explicit way to keep the initials circle even when `admin.avatar` is set.

  return <ThemeAvatarProvider value={{ node, src }}>{children}</ThemeAvatarProvider>
}

export default AvatarProvider
