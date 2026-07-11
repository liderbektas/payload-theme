/**
 * Public options for {@link payloadTheme}, plus the runtime resolution that
 * validates them and fills defaults. Everything a component needs at runtime is
 * serializable (strings only) so it can cross Payload's server→client boundary
 * via `admin.custom`.
 */

import { normalizeHex } from './theme'

/** Surface/neutral palette, independent of the accent. */
export type ThemePreset = 'minimal' | 'noir' | 'soft'

/** Global corner-rounding scale. */
export type ThemeRadius = 'lg' | 'md' | 'sm'

/**
 * An image URL (`'/logo.svg'`), or a pair of URLs when light and dark mode
 * need different artwork.
 */
export type ThemeAsset = string | { dark: string; light: string }

export interface NavOptions {
  /**
   * Per-entity sidebar icons, keyed by collection/global slug. Values are
   * lucide icon names in kebab-case (e.g. `'newspaper'`, `'shopping-cart'`) —
   * any icon from https://lucide.dev works. Unmapped entities fall back to a
   * folder icon.
   */
  icons?: Record<string, string>
}

export interface PayloadThemeOptions {
  /** The single accent color as a hex string. Drives the whole 50–950 scale. */
  accent?: string
  /** Surface/neutral palette. @default 'soft' */
  preset?: ThemePreset
  /** Global corner rounding. @default 'md' */
  radius?: ThemeRadius
  /**
   * Sidebar logo, rendered as `<img>` at the top of the nav. A URL
   * (`'/logo.svg'`) or `{ light, dark }` URLs to swap artwork per color
   * scheme. Falls back to Payload's own logo when omitted.
   */
  logo?: ThemeAsset
  /**
   * Rendered height of the sidebar logo. A number is treated as pixels
   * (`32` → `32px`); a string is used as-is (`'2.5rem'`). @default 26px
   */
  logoHeight?: number | string
  /** Small mark/favicon for collapsed nav and login. Same shape as `logo`. */
  icon?: ThemeAsset
  /** Sidebar navigation options. */
  nav?: NavOptions
  /** Escape hatch: raw `--pt-*` token overrides applied after the computed scale. */
  cssVariables?: Record<string, string>
}

/**
 * The serializable slice stored on `config.admin.custom.payloadTheme` and read
 * by the client Nav / ThemeProvider and the server Dashboard.
 */
export interface ResolvedThemeConfig {
  /** Precomputed `--pt-*` CSS custom properties (light + dark), injected at runtime. */
  css: string
  preset: ThemePreset
  radius: ThemeRadius
  /** Normalized to a pair: a plain-string option is used for both schemes. */
  logo?: { dark: string; light: string }
  icon?: { dark: string; light: string }
  nav: { icons: Record<string, string> }
  /** lucide icon name used when an entity has no mapping. */
  fallbackIconName: string
}

const PRESETS: ThemePreset[] = ['soft', 'noir', 'minimal']
const RADII: ThemeRadius[] = ['sm', 'md', 'lg']

const DEFAULTS = {
  accent: '#4f4ece',
  preset: 'soft' as ThemePreset,
  radius: 'md' as ThemeRadius,
  fallbackIconName: 'folder',
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[payload-theme] ${message}`)
}

/** Validate a logo/icon option and normalize it to a `{ light, dark }` pair. */
function normalizeAsset(
  value: ThemeAsset | undefined,
  name: string,
): { dark: string; light: string } | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'string') return { dark: value, light: value }
  assert(
    value && typeof value === 'object' && typeof value.light === 'string' && typeof value.dark === 'string',
    `${name} must be a URL string or an object like { light: '/logo.svg', dark: '/logo-dark.svg' }.`,
  )
  return { dark: value.dark, light: value.light }
}

/** Validate user options (clear errors) and return everything needed downstream. */
export function resolveOptions(options: PayloadThemeOptions): {
  accent: string
  cssVariables?: Record<string, string>
  resolved: ResolvedThemeConfig
} {
  const accent = options.accent ?? DEFAULTS.accent
  // normalizeHex throws a clear message like:
  // "Invalid accent color: 'mor'. Expected hex like #7c3aed"
  normalizeHex(accent)

  const preset = options.preset ?? DEFAULTS.preset
  assert(PRESETS.includes(preset), `Invalid preset: '${preset}'. Expected one of ${PRESETS.join(', ')}.`)

  const radius = options.radius ?? DEFAULTS.radius
  assert(RADII.includes(radius), `Invalid radius: '${radius}'. Expected one of ${RADII.join(', ')}.`)

  const icons = options.nav?.icons ?? {}
  assert(
    icons && typeof icons === 'object' && !Array.isArray(icons),
    'nav.icons must be an object mapping slugs to lucide icon names.',
  )
  for (const [slug, name] of Object.entries(icons)) {
    assert(typeof name === 'string', `nav.icons['${slug}'] must be a string lucide icon name.`)
  }

  const logo = normalizeAsset(options.logo, 'logo')
  const icon = normalizeAsset(options.icon, 'icon')

  let cssVariables = options.cssVariables
  if (options.logoHeight !== undefined) {
    const height = options.logoHeight
    assert(
      (typeof height === 'number' && Number.isFinite(height) && height > 0) ||
        (typeof height === 'string' && height.trim() !== ''),
      `logoHeight must be a positive number (px) or a CSS length string, got '${String(height)}'.`,
    )
    const value = typeof height === 'number' ? `${height}px` : height
    cssVariables = { '--pt-logo-height': value, ...cssVariables }
  }

  return {
    accent,
    cssVariables,
    resolved: {
      css: '', // filled by the plugin after computing the scale
      preset,
      radius,
      logo,
      icon,
      nav: { icons },
      fallbackIconName: DEFAULTS.fallbackIconName,
    },
  }
}
