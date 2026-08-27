'use client'

import React from 'react'

import { FLAGS } from './flags'
import { localeToRegion } from './regions'

export { localeToRegion } from './regions'

export type FlagProps = {
  /** A Payload locale code — `tr`, `en-GB`, `pt_BR`, `zh-Hant-TW`. */
  code: string
} & Omit<React.SVGProps<SVGSVGElement>, 'children' | 'viewBox'>

/**
 * A small rounded flag chip for a locale code, or nothing when the code maps
 * to no flag we draw — the caller pairs this with the locale code itself, so a
 * missing flag degrades to a plain `(xx)` badge rather than a hole in the row.
 *
 * The corners are clipped in SVG rather than with `border-radius` so the mark
 * is identical everywhere: `border-radius` on an inline `<svg>` is honoured by
 * browsers but is a paint-time clip, and a 20px chip has no pixels to spare if
 * one of them decides otherwise.
 */
export const Flag: React.FC<FlagProps> = ({ className, code, ...rest }) => {
  // `useId` runs unconditionally — the early return has to come after it.
  const rawId = React.useId()

  const region = localeToRegion(code)
  const draw = region ? FLAGS[region] : undefined
  if (!draw) return null

  // `useId` emits colons (`:r3:`); harmless in an id, but they have burned
  // enough `url(#…)` lookups over the years to be worth stripping.
  const clipId = `pt-flag-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <svg
      aria-hidden="true"
      className={['pt-flag', className].filter(Boolean).join(' ')}
      viewBox="0 0 24 18"
      {...rest}
    >
      <defs>
        <clipPath id={clipId}>
          <rect height="18" rx="2.6" ry="2.6" width="24" x="0" y="0" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{draw()}</g>
      {/* Hairline ring: keeps a white-heavy flag (Japan, Poland) from
       * dissolving into the menu's own white background. */}
      <rect
        fill="none"
        height="17"
        rx="2.1"
        ry="2.1"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="1"
        width="23"
        x="0.5"
        y="0.5"
      />
    </svg>
  )
}

export default Flag
