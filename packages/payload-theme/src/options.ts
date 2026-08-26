/**
 * Public options for {@link payloadTheme}, plus the runtime resolution that
 * validates them and fills defaults. Everything a component needs at runtime is
 * serializable (strings only) so it can cross Payload's server→client boundary
 * via `admin.custom`.
 */

import type { I18n } from '@payloadcms/translations'
import type { Locale, Payload, PayloadComponent, TypedUser } from 'payload'

import type { ThemeFontKey } from './theme'

import { normalizeHex, resolveFont } from './theme'

/**
 * A one-word starting point: each preset is a coherent accent + radius +
 * typeface identity, the same six the header customizer offers. Any option you
 * also pass explicitly wins over the preset, so `preset` is a set of defaults,
 * never a lock.
 */
export type ThemePreset = 'berry' | 'forest' | 'ocean' | 'sunset' | 'swiss' | 'zinc'

/**
 * Panel typeface. `'inter'` and `'geist'` load from Google Fonts at runtime;
 * `'helvetica'` and `'system'` are pure font stacks (no network). Any other
 * string is used verbatim as a CSS font-family stack — self-host the face
 * with your own `@font-face` and pass the family here.
 * @default 'default' (Payload's own font)
 */
export type ThemeFont = 'default' | 'geist' | 'helvetica' | 'inter' | 'system' | (string & {})

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

/**
 * Where the user avatar in the sidebar/header user block comes from.
 *
 * - `'initials'` — the accent circle with the user's initials (the default
 *   look, and the explicit way to opt OUT of Payload's `admin.avatar`).
 * - `'gravatar'` — the Gravatar registered to the user's email.
 * - `{ field }` — a field on the authenticated user's document: an `upload`
 *   or `relationship` to an upload collection, or a plain text/URL field.
 *   Dot paths reach into groups (`'profile.photo'`). `size` picks a named
 *   upload size (`'thumbnail'`) instead of the original file.
 *
 * When this option is omitted the theme honors Payload's own
 * `admin.avatar` — `'gravatar'` and `{ Component }` both render inside the
 * theme's avatar circle — and falls back to initials.
 */
export type ThemeAvatarOption = 'gravatar' | 'initials' | { field: string; size?: string }

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
  /**
   * A whole look in one word — `'zinc'`, `'ocean'`, `'forest'`, `'sunset'`,
   * `'berry'` or `'swiss'`. Sets the accent, radius and typeface together;
   * pass any of those explicitly to override just that part.
   */
  preset?: ThemePreset
  /** The single accent color as a hex string. Drives the whole 50–950 scale. */
  accent?: string
  /** Global corner rounding. @default 'md' */
  radius?: ThemeRadius
  /** Panel typeface — a built-in key or a custom CSS font-family stack. @default 'default' */
  font?: ThemeFont
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
  /**
   * Source of the user avatar in the sidebar and header user blocks.
   * Omit to honor Payload's `admin.avatar` (gravatar or a custom
   * `Component`), falling back to the accent initials circle.
   */
  avatar?: ThemeAvatarOption
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

/**
 * The avatar option normalized for the server→client trip: a plain tagged
 * object, never a bare string, so the `AvatarProvider` can switch on `type`.
 * `null` means "not configured" — Payload's own `admin.avatar` decides.
 */
export type ResolvedAvatar =
  { name: string; size: null | string; type: 'field' } | { type: 'gravatar' } | { type: 'initials' }

export interface ResolvedThemeConfig {
  /** Precomputed `--pt-*` CSS custom properties (light + dark), injected at runtime. */
  css: string
  /** The configured accent as canonical hex — read by the header customizer. */
  accent: string
  /** The preset the config named, or null when the options stand alone. */
  preset: null | ThemePreset
  radius: ThemeRadius
  /** The configured font option as given ('default' when omitted). */
  font: string
  /** Webfont stylesheet URL when the font needs loading (inter/geist), else null. */
  fontURL: null | string
  /** Normalized widget list; empty when the option is omitted. */
  dashboard: { widgets: ResolvedDashboardWidget[] }
  /** Normalized to a pair: a plain-string option is used for both schemes. */
  logo?: { dark: string; light: string }
  icon?: { dark: string; light: string }
  /** Avatar source, or null when the `avatar` option is omitted. */
  avatar: null | ResolvedAvatar
  nav: { icons: Record<string, string> }
  /** Unset fields fall back to the defaults at render time. */
  login: { heading?: string; tagline?: string }
  /** lucide icon name used when an entity has no mapping. */
  fallbackIconName: string
}

/** One preset's full identity. `label` is the customizer's button text. */
export interface ThemePresetDefinition {
  accent: string
  font: ThemeFontKey
  key: ThemePreset
  label: string
  radius: ThemeRadius
}

/**
 * The six built-in looks, shared by the `preset` option and the header
 * customizer's preset row — one list, so a config-set preset and a clicked one
 * are always the same theme. Neutral names on purpose: each is a coherent
 * identity, not a brand.
 */
export const THEME_PRESETS: ThemePresetDefinition[] = [
  { key: 'zinc', label: 'Zinc', accent: '#18181b', font: 'geist', radius: 'md' },
  { key: 'ocean', label: 'Ocean', accent: '#2563eb', font: 'inter', radius: 'lg' },
  { key: 'forest', label: 'Forest', accent: '#059669', font: 'inter', radius: 'md' },
  { key: 'sunset', label: 'Sunset', accent: '#ea580c', font: 'inter', radius: 'full' },
  { key: 'berry', label: 'Berry', accent: '#db2777', font: 'geist', radius: 'lg' },
  { key: 'swiss', label: 'Swiss', accent: '#dc2626', font: 'helvetica', radius: 'none' },
]

const PRESETS: ThemePreset[] = THEME_PRESETS.map((preset) => preset.key)
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
  radius: 'md' as ThemeRadius,
  font: 'default',
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

/** Validate the `avatar` option and normalize it to a tagged object. */
function normalizeAvatar(value: ThemeAvatarOption | undefined): null | ResolvedAvatar {
  if (value === undefined) return null

  if (typeof value === 'string') {
    assert(
      value === 'initials' || value === 'gravatar',
      `Invalid avatar: '${value}'. Expected 'initials', 'gravatar' or { field: 'avatar' }.`,
    )
    return value === 'gravatar' ? { type: 'gravatar' } : { type: 'initials' }
  }

  assert(
    value && typeof value === 'object' && !Array.isArray(value),
    `avatar must be 'initials', 'gravatar' or an object like { field: 'avatar' }.`,
  )
  assert(
    typeof value.field === 'string' && value.field.trim() !== '',
    `avatar.field must be the name of a field on your auth collection, e.g. { field: 'avatar' }.`,
  )
  assert(
    value.size === undefined || (typeof value.size === 'string' && value.size.trim() !== ''),
    `avatar.size must be the name of an upload size, e.g. { field: 'avatar', size: 'thumbnail' }.`,
  )
  return { type: 'field', name: value.field.trim(), size: value.size?.trim() ?? null }
}

/** Validate a logo/icon option and normalize it to a `{ light, dark }` pair. */
function normalizeAsset(
  value: ThemeAsset | undefined,
  name: string,
): { dark: string; light: string } | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'string') return { dark: value, light: value }
  assert(
    value &&
      typeof value === 'object' &&
      typeof value.light === 'string' &&
      typeof value.dark === 'string',
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
  // A preset only supplies defaults — every explicit option still wins, so
  // `preset: 'ocean', accent: '#e30613'` is Ocean's geometry in your red.
  const presetKey = options.preset ?? null
  if (presetKey !== null) {
    assert(
      PRESETS.includes(presetKey),
      `Invalid preset: '${presetKey}'. Expected one of ${PRESETS.join(', ')}.`,
    )
  }
  const preset = THEME_PRESETS.find((candidate) => candidate.key === presetKey)

  const accent = options.accent ?? preset?.accent ?? DEFAULTS.accent
  // normalizeHex throws a clear message like:
  // "Invalid accent color: 'mor'. Expected hex like #7c3aed"
  normalizeHex(accent)

  const radius = options.radius ?? preset?.radius ?? DEFAULTS.radius
  assert(
    RADII.includes(radius),
    `Invalid radius: '${radius}'. Expected one of ${RADII.join(', ')}.`,
  )

  const font = options.font ?? preset?.font ?? DEFAULTS.font
  assert(
    typeof font === 'string' && font.trim() !== '',
    `font must be a non-empty string — a built-in key ('inter', 'geist', 'helvetica', 'system') or a CSS font-family stack.`,
  )
  const resolvedFont = resolveFont(font)

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
  const avatar = normalizeAvatar(options.avatar)
  const widgets = normalizeWidgets(options.dashboard?.widgets)

  const loginHeading = options.login?.heading
  const loginTagline = options.login?.tagline
  assert(
    loginHeading === undefined || typeof loginHeading === 'string',
    'login.heading must be a string.',
  )
  assert(
    loginTagline === undefined || typeof loginTagline === 'string',
    'login.tagline must be a string.',
  )

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
      preset: presetKey,
      radius,
      font,
      fontURL: resolvedFont.url,
      dashboard: { widgets },
      logo,
      icon,
      avatar,
      nav: { icons },
      login: { heading: loginHeading, tagline: loginTagline },
      fallbackIconName: DEFAULTS.fallbackIconName,
    },
  }
}
