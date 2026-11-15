import type { ServerProps } from 'payload'

import React from 'react'

import type { ResolvedThemeConfig } from '../../options.js'

import { BOOT_SCRIPT } from './boot.js'

/**
 * Replays the header customizer's overrides before the first paint.
 *
 * A SERVER component on purpose: an inline <script> only runs when the
 * browser parses it out of the HTML. Rendered from a client component it is
 * also created on the client (`document.createElement('script')`), which the
 * browser never executes — React warns "Encountered a script tag while
 * rendering React component". `BOOT_SCRIPT` is a constant that reads its data
 * from `localStorage`, so nothing here needs the client.
 *
 * Only with a user. Payload's `AuthProvider` (which wraps every registered
 * provider) renders nothing on the server until it has a user, so on the
 * unauthenticated views — login, forgot/reset password, create-first-user —
 * this whole subtree is rendered in the browser only. A <script> there would
 * be created client-side, never run, and bring the warning back. Nothing is
 * lost: the customizer lives in the authenticated header, and a full load of
 * any authenticated page still gets the script in its HTML.
 *
 * Not with `customizer: false` either: there is no customizer to take over
 * from the script, and overrides a browser saved while it was on must not
 * keep applying with no way to reset them.
 *
 * Registered first in `admin.components.providers` — the outermost of ours —
 * so the script lands ahead of everything else in the HTML.
 */
export const BootScript: React.FC<{ children?: React.ReactNode } & ServerProps> = ({
  children,
  payload,
  user,
}) => {
  const theme = payload?.config?.admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined
  const customizer = theme?.customizer !== false

  return (
    <React.Fragment>
      {user && customizer ? (
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} suppressHydrationWarning />
      ) : null}
      {children}
    </React.Fragment>
  )
}

export default BootScript
