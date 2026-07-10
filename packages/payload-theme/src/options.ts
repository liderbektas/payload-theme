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
   * Sidebar logo: a URL to an image (`'/logo.svg'`) rendered as `<img>`, or a
   * Payload import-map component path (`'/components/MyLogo#MyLogo'`). Falls
   * back to Payload's own logo when omitted.
   */
  logo?: string
  /** Small mark/favicon for collapsed nav and login. Same shape as `logo`. */
  icon?: string
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
  logo?: string
  icon?: string
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

  if (options.logo !== undefined) assert(typeof options.logo === 'string', 'logo must be a string (URL or component path).')
  if (options.icon !== undefined) assert(typeof options.icon === 'string', 'icon must be a string (URL or component path).')

  return {
    accent,
    cssVariables: options.cssVariables,
    resolved: {
      css: '', // filled by the plugin after computing the scale
      preset,
      radius,
      logo: options.logo,
      icon: options.icon,
      nav: { icons },
      fallbackIconName: DEFAULTS.fallbackIconName,
    },
  }
}
