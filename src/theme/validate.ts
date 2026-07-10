/**
 * Hand-written input validation (no schema library).
 *
 * The public surface takes a single accent hex; invalid input must fail early
 * with a message that tells the user exactly what shape is expected.
 */

import { hexToRgb, rgbToHex } from './oklch'

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** Type guard: true when `value` is a `#rgb` or `#rrggbb` hex string. */
export function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value.trim())
}

/**
 * Validate and normalize an accent hex to canonical lowercase `#rrggbb`.
 * Throws a descriptive Error on anything that is not a 3- or 6-digit hex.
 */
export function normalizeHex(value: unknown, label = 'accent color'): string {
  if (!isValidHex(value)) {
    const shown = typeof value === 'string' ? `'${value}'` : String(value)
    throw new Error(`Invalid ${label}: ${shown}. Expected hex like #7c3aed`)
  }
  // isValidHex guarantees hexToRgb succeeds; rebuild to canonical #rrggbb.
  return rgbToHex(hexToRgb(value)!)
}
