import React from 'react'

import { BOOT_SCRIPT } from './boot'

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
 * Registered first in `admin.components.providers` — the outermost provider —
 * so the script lands ahead of everything else in the HTML.
 */
export const BootScript: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <React.Fragment>
    <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} suppressHydrationWarning />
    {children}
  </React.Fragment>
)

export default BootScript
