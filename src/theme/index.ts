/**
 * Theme engine — public API.
 *
 * `buildTheme(accent)` is the one entry point the plugin needs: it validates a
 * single accent hex, derives the 50..950 OKLCH scale, and maps semantic accent
 * tokens for both light and dark. Everything here is pure and dependency-free;
 * turning these values into CSS custom properties happens in a later phase.
 */

import { pickContrastText } from './contrast'
import { hexToRgb, rgbToOklch } from './oklch'
import { generateScale, type Scale, type ScaleStep } from './scale'
import { normalizeHex } from './validate'

/** Semantic accent tokens for a single color mode. */
export interface AccentTokens {
  /** Primary accent (buttons, active nav, links). */
  accent: string
  /** Accent on hover. */
  accentHover: string
  /** Accent while pressed/active. */
  accentActive: string
  /** Faint accent wash for subtle backgrounds (selected rows, hover fills). */
  accentSubtle: string
  /** Auto-picked black or white text that sits on `accent`. */
  accentContrast: string
  /** Base color for focus rings (used with alpha in CSS). */
  accentRing: string
}

/** The full computed theme for one accent. */
export interface Theme {
  /** The normalized input accent as canonical `#rrggbb`. */
  accent: string
  /** The 50..950 scale. */
  scale: Scale
  /** Semantic tokens for light mode. */
  light: AccentTokens
  /** Semantic tokens for dark mode. */
  dark: AccentTokens
}

/**
 * Which scale step backs each semantic token, per mode. The scale is never
 * inverted for dark; dark simply reads primaries off the brighter rungs so the
 * accent stays legible on a dark surface.
 */
export const TOKEN_STEPS: Record<'light' | 'dark', Record<keyof Omit<AccentTokens, 'accentContrast'>, ScaleStep>> = {
  light: { accent: 600, accentHover: 700, accentActive: 800, accentSubtle: 50, accentRing: 500 },
  dark: { accent: 400, accentHover: 300, accentActive: 200, accentSubtle: 900, accentRing: 400 },
}

function buildTokens(scale: Scale, mode: 'light' | 'dark'): AccentTokens {
  const steps = TOKEN_STEPS[mode]
  const accent = scale[steps.accent]
  return {
    accent,
    accentHover: scale[steps.accentHover],
    accentActive: scale[steps.accentActive],
    accentSubtle: scale[steps.accentSubtle],
    accentRing: scale[steps.accentRing],
    accentContrast: pickContrastText(hexToRgb(accent)!).color,
  }
}

/**
 * Build the complete theme from a single accent hex.
 * @throws if `accent` is not a valid `#rgb` / `#rrggbb` hex.
 */
export function buildTheme(accent: string): Theme {
  const normalized = normalizeHex(accent)
  const scale = generateScale(rgbToOklch(hexToRgb(normalized)!))
  return {
    accent: normalized,
    scale,
    light: buildTokens(scale, 'light'),
    dark: buildTokens(scale, 'dark'),
  }
}

export {
  hexToRgb,
  rgbToHex,
  rgbToOklch,
  oklchToHex,
  hexToOklch,
  oklchToRgbGamut,
  type RGB,
  type OKLCH,
} from './oklch'
export { relativeLuminance, contrastRatio, pickContrastText, pickContrastTextForHex } from './contrast'
export { generateScale, generateScaleOklch, SCALE_STEPS, type Scale, type ScaleStep } from './scale'
export { isValidHex, normalizeHex } from './validate'
export { themeToCss, type ThemeCssOptions } from './css'
