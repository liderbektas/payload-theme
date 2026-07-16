/**
 * Public options for {@link payloadTheme}, plus the runtime resolution that
 * validates them and fills defaults. Everything a component needs at runtime is
 * serializable (strings only) so it can cross Payload's server→client boundary
 * via `admin.custom`.
 */

import type { I18n } from '@payloadcms/translations'
import type { Locale, Payload, PayloadComponent, TypedUser } from 'payload'

import { normalizeHex } from './theme'

/** Surface/neutral palette, independent of the accent. */
export type ThemePreset = 'minimal' | 'noir' | 'soft'

/**
 * Global corner-rounding scale. Applied to every surface: `md` is the default
 * shadcn geometry (8px controls, 12px cards), `full` gives pill
 * buttons/inputs, `none` squares everything off, the rest sit in between.
 */
export type ThemeRadius = 'full' | 'lg' | 'md' | 'none' | 'sm'

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

/** Grid width of one dashboard widget. @default 'half' */
export type DashboardWidgetWidth = 'full' | 'half' | 'third'

/**
 * One dashboard widget: any React component of your own, referenced by its
 * import-map path — the same convention Payload uses for every custom
 * component (`'/components/MyWidget#MyWidget'` or
 * `{ path: '/components/MyWidget', exportName: 'MyWidget' }`). Server and
 * client components both work; server components receive `{ payload, user,
 * i18n, locale }` as props. Wrap in an object with `width` to control how
 * much of the row the widget spans.
 */
export type DashboardWidget =
  | PayloadComponent
  | {
      component: PayloadComponent
      width?: DashboardWidgetWidth
    }

/**
 * Props the Dashboard passes to every *server* widget component (client
 * widgets receive no props — they can use Payload's hooks instead).
 */
export interface DashboardWidgetServerProps {
  i18n: I18n
  locale?: Locale
  payload: Payload
  user: null | TypedUser
}

export interface DashboardOptions {
  /**
   * Widgets rendered below the built-in dashboard content (collections,
   * globals, recent activity). Empty or omitted → nothing extra renders and
   * the dashboard looks exactly as before.
   */
  widgets?: DashboardWidget[]
}

export interface LoginOptions {
  /** Big heading on the login brand panel. @default 'Welcome back' */
  heading?: string
  /** Supporting line under the heading. @default 'Sign in to manage your content.' */
  tagline?: string
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
  /** Dashboard widget area (rendered below the built-in dashboard content). */
  dashboard?: DashboardOptions
  /** Copy shown on the login screen's brand panel. */
  login?: LoginOptions
  /** Escape hatch: raw `--pt-*` token overrides applied after the computed scale. */
  cssVariables?: Record<string, string>
}

/**
 * The serializable slice stored on `config.admin.custom.payloadTheme` and read
 * by the client Nav / ThemeProvider and the server Dashboard.
 */
/** A widget normalized to object form, with the width default applied. */
export interface ResolvedDashboardWidget {
  component: PayloadComponent
  width: DashboardWidgetWidth
}

export interface ResolvedThemeConfig {
  /** Precomputed `--pt-*` CSS custom properties (light + dark), injected at runtime. */
  css: string
  /** The configured accent as canonical hex — read by the header customizer. */
  accent: string
  preset: ThemePreset
  radius: ThemeRadius
  /** Normalized widget list; empty when the option is omitted. */
  dashboard: { widgets: ResolvedDashboardWidget[] }
  /** Normalized to a pair: a plain-string option is used for both schemes. */
  logo?: { dark: string; light: string }
  icon?: { dark: string; light: string }
  nav: { icons: Record<string, string> }
  /** Unset fields fall back to the defaults at render time. */
  login: { heading?: string; tagline?: string }
  /** lucide icon name used when an entity has no mapping. */
  fallbackIconName: string
}

const PRESETS: ThemePreset[] = ['soft', 'noir', 'minimal']
const RADII: ThemeRadius[] = ['none', 'sm', 'md', 'lg', 'full']

/**
 * Radius option → the three `--pt-radius-*` tokens the stylesheet reads.
 * `ctl` = controls (buttons, inputs, pills, nav links), `card` = surfaces
 * (cards, tables, popovers, modals), `item` = small inner items (menu rows,
 * chips, paginator pages). `md` matches the reference shadcn geometry
 * (rounded-md controls, rounded-xl cards) and is the default.
 */
export const RADIUS_TOKENS: Record<ThemeRadius, { card: string; ctl: string; item: string }> = {
  full: { card: '14px', ctl: '999px', item: '9px' },
  lg: { card: '16px', ctl: '10px', item: '8px' },
  md: { card: '12px', ctl: '8px', item: '6px' },
  sm: { card: '8px', ctl: '6px', item: '4px' },
  none: { card: '0px', ctl: '0px', item: '0px' },
}

const DEFAULTS = {
  accent: '#4f4ece',
  preset: 'soft' as ThemePreset,
  radius: 'md' as ThemeRadius,
  fallbackIconName: 'folder',
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[payload-theme] ${message}`)
}

const WIDGET_WIDTHS: DashboardWidgetWidth[] = ['full', 'half', 'third']
const DEFAULT_WIDGET_WIDTH: DashboardWidgetWidth = 'half'

/** True for a valid `PayloadComponent`: an import-map path string or a `{ path }` object. */
function isPayloadComponent(value: unknown): value is PayloadComponent {
  if (typeof value === 'string') return value.trim() !== ''
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { path?: unknown }).path === 'string' &&
    (value as { path: string }).path.trim() !== ''
  )
}

/** Validate `dashboard.widgets` and normalize each entry to `{ component, width }`. */
function normalizeWidgets(widgets: DashboardWidget[] | undefined): ResolvedDashboardWidget[] {
  if (widgets === undefined) return []
  assert(Array.isArray(widgets), 'dashboard.widgets must be an array of widget definitions.')

  return widgets.map((widget, index) => {
    const describe = `dashboard.widgets[${index}]`

    if (isPayloadComponent(widget)) {
      return { component: widget, width: DEFAULT_WIDGET_WIDTH }
    }

    assert(
      widget && typeof widget === 'object' && 'component' in widget,
      `${describe} must be a component path string (e.g. '/components/MyWidget#MyWidget'), a { path, exportName } object, or a { component, width } object.`,
    )
    assert(
      isPayloadComponent(widget.component),
      `${describe}.component must be a component path string or a { path, exportName } object.`,
    )
    const width = widget.width ?? DEFAULT_WIDGET_WIDTH
    assert(
      WIDGET_WIDTHS.includes(width),
      `${describe}.width must be one of ${WIDGET_WIDTHS.join(', ')}, got '${String(widget.width)}'.`,
    )
    return { component: widget.component, width }
  })
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
  const widgets = normalizeWidgets(options.dashboard?.widgets)

  const loginHeading = options.login?.heading
  const loginTagline = options.login?.tagline
  assert(loginHeading === undefined || typeof loginHeading === 'string', 'login.heading must be a string.')
  assert(loginTagline === undefined || typeof loginTagline === 'string', 'login.tagline must be a string.')

  // Radius tokens first, then logoHeight, then the user's raw overrides —
  // later keys win, so cssVariables stays the ultimate escape hatch.
  const radiusTokens = RADIUS_TOKENS[radius]
  let cssVariables: Record<string, string> = {
    '--pt-radius-card': radiusTokens.card,
    '--pt-radius-ctl': radiusTokens.ctl,
    '--pt-radius-item': radiusTokens.item,
    ...options.cssVariables,
  }
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
      accent: normalizeHex(accent),
      preset,
      radius,
      dashboard: { widgets },
      logo,
      icon,
      nav: { icons },
      login: { heading: loginHeading, tagline: loginTagline },
      fallbackIconName: DEFAULTS.fallbackIconName,
    },
  }
}
