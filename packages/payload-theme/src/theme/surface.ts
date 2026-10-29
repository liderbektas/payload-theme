/**
 * Surface options — everything about the panel's look that is NOT the accent:
 * the neutral gray family, the dark-mode depth, spacing density and the
 * content frame. Each one is a handful of CSS custom properties the static
 * stylesheet already reads with the default baked in, so the defaults emit
 * nothing and every other choice is a small override block.
 *
 * Pure and dependency-free, like the rest of the engine: the plugin renders
 * the result into the ThemeProvider's <style> on the server, and the header
 * customizer renders it again client-side for live overrides.
 */

/** The neutral gray family behind every surface, border and text rung. @default 'zinc' */
export type ThemeNeutral = 'gray' | 'neutral' | 'slate' | 'stone' | 'zinc'

/**
 * Dark-mode depth. `'deep'` puts the content card on near-black (zinc-950);
 * `'dim'` lifts every surface one rung for a softer, lower-contrast night
 * look. @default 'deep'
 */
export type ThemeDarkMode = 'deep' | 'dim'

/** Spacing density for controls, table rows and the form grid. @default 'comfortable' */
export type ThemeDensity = 'comfortable' | 'compact'

/**
 * Content frame. `'inset'` floats the content in a rounded, bordered card on
 * the gray field; `'flat'` runs it edge to edge with a single divider against
 * the sidebar. @default 'inset'
 */
export type ThemeFrame = 'flat' | 'inset'

export interface SurfaceOptions {
  dark: ThemeDarkMode
  density: ThemeDensity
  frame: ThemeFrame
  neutral: ThemeNeutral
}

export const NEUTRALS: ThemeNeutral[] = ['zinc', 'slate', 'gray', 'neutral', 'stone']
export const DARK_MODES: ThemeDarkMode[] = ['deep', 'dim']
export const DENSITIES: ThemeDensity[] = ['comfortable', 'compact']
export const FRAMES: ThemeFrame[] = ['inset', 'flat']

export const SURFACE_DEFAULTS: SurfaceOptions = {
  dark: 'deep',
  density: 'comfortable',
  frame: 'inset',
  neutral: 'zinc',
}

type NeutralStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

/**
 * The Tailwind neutral families, 50–950. Payload's ladder needs 21 rungs; the
 * in-between steps (150, 250, …) are channel midpoints, the same way
 * `base/foundation.css` derives its zinc mid-steps.
 */
export const NEUTRAL_PALETTES: Record<ThemeNeutral, Record<NeutralStep, string>> = {
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  stone: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
  zinc: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
    950: '#09090b',
  },
}

/** Channel-wise midpoint of two `#rrggbb` colors (halves round up). */
function midpoint(a: string, b: string): string {
  let out = '#'
  for (let i = 1; i < 7; i += 2) {
    const value = Math.round(
      (parseInt(a.slice(i, i + 2), 16) + parseInt(b.slice(i, i + 2), 16)) / 2,
    )
    out += value.toString(16).padStart(2, '0')
  }
  return out
}

/** The full 0–1000 ladder Payload derives `--theme-elevation-*` from. */
export function neutralLadder(neutral: ThemeNeutral): Record<number, string> {
  const palette = NEUTRAL_PALETTES[neutral]
  const ladder: Record<number, string> = { 0: '#ffffff', 1000: '#030303' }
  const steps: NeutralStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
  steps.forEach((step, index) => {
    ladder[step] = palette[step]
    const next = steps[index + 1]
    // 150, 250 … 850 sit between two hundreds; 50 and 950 already exist
    if (next !== undefined && next - step === 100 && step >= 100) {
      ladder[step + 50] = midpoint(palette[step], palette[next])
    }
  })
  return ladder
}

/**
 * Spacing tokens per density. The comfortable values are the stylesheet's own
 * fallbacks (`var(--pt-ctl-h, 40px)` …), so only `compact` ever emits.
 */
export const DENSITY_TOKENS: Record<ThemeDensity, Record<string, string>> = {
  comfortable: {
    '--pt-ctl-h': '40px',
    '--pt-ctl-py': '7px',
    '--pt-btn-py': '8px',
    '--pt-cell-py': '12px',
    '--pt-field-gap': '22px',
    '--pt-section-gap': '24px',
  },
  compact: {
    '--pt-ctl-h': '34px',
    '--pt-ctl-py': '4px',
    '--pt-btn-py': '5px',
    '--pt-cell-py': '7px',
    '--pt-field-gap': '14px',
    '--pt-section-gap': '16px',
  },
}

/** Frame tokens read by `layout/frame.css` (inset values are its fallbacks). */
export const FRAME_TOKENS: Record<ThemeFrame, Record<string, string>> = {
  inset: {
    '--pt-frame-inset': '8px',
    '--pt-frame-radius': 'var(--pt-radius-card)',
    '--pt-frame-border': '1px',
    '--pt-frame-shadow': 'var(--pt-shadow-sm)',
  },
  flat: {
    '--pt-frame-inset': '0px',
    '--pt-frame-radius': '0px',
    '--pt-frame-border': '0px',
    '--pt-frame-shadow': '0 0 #0000',
  },
}

/**
 * Dark elevation remaps. `deep` is what `base/foundation.css` ships; `dim`
 * moves the card one rung up the ladder (zinc-900 instead of 950) and the
 * field it floats on to 850, keeping borders a step above the card.
 */
export const DARK_TOKENS: Record<ThemeDarkMode, Record<string, string>> = {
  deep: {
    '--theme-bg': 'var(--color-base-900)',
    '--theme-elevation-0': 'var(--color-base-950)',
    '--theme-elevation-50': 'var(--color-base-900)',
    '--theme-elevation-100': 'var(--color-base-850)',
    '--theme-elevation-150': 'var(--color-base-800)',
    '--theme-elevation-200': 'var(--color-base-750)',
    '--theme-elevation-250': 'var(--color-base-700)',
  },
  dim: {
    '--theme-bg': 'var(--color-base-850)',
    '--theme-elevation-0': 'var(--color-base-900)',
    '--theme-elevation-50': 'var(--color-base-850)',
    '--theme-elevation-100': 'var(--color-base-800)',
    '--theme-elevation-150': 'var(--color-base-750)',
    '--theme-elevation-200': 'var(--color-base-700)',
    '--theme-elevation-250': 'var(--color-base-650)',
  },
}

export interface SurfaceCssOptions {
  /** Selector for the mode-independent tokens. Default `:root`. */
  rootSelector?: string
  /** Selector for the dark-mode tokens. Default `html[data-theme='dark']`. */
  darkSelector?: string
  /**
   * Emit every token, defaults included. The server leaves defaults to the
   * stylesheet; the live customizer needs them spelled out so a runtime
   * "back to zinc" can beat a config that chose slate.
   */
  full?: boolean
  /** Wrap in `@layer payload`. Default `true`. */
  layer?: boolean
}

/** Render the surface options to CSS — `''` when nothing differs from the stylesheet. */
export function surfaceToCss(surface: SurfaceOptions, opts: SurfaceCssOptions = {}): string {
  const {
    rootSelector = ':root',
    darkSelector = "html[data-theme='dark']",
    full = false,
    layer = true,
  } = opts

  const root: Record<string, string> = {}
  const dark: Record<string, string> = {}

  if (full || surface.neutral !== SURFACE_DEFAULTS.neutral) {
    for (const [step, hex] of Object.entries(neutralLadder(surface.neutral))) {
      root[`--color-base-${step}`] = hex
    }
    // the gray field; zinc keeps the stylesheet's hand-tuned #f4f4f6
    root['--theme-bg'] = surface.neutral === 'zinc' ? '#f4f4f6' : 'var(--color-base-100)'
  }
  if (full || surface.density !== SURFACE_DEFAULTS.density) {
    Object.assign(root, DENSITY_TOKENS[surface.density])
  }
  if (full || surface.frame !== SURFACE_DEFAULTS.frame) {
    Object.assign(root, FRAME_TOKENS[surface.frame])
  }
  // In full mode the root selector is doubled for specificity (the live
  // customizer), which would let its light `--theme-bg` win in dark mode too —
  // so the dark block is always spelled out alongside it.
  if (full || surface.dark !== SURFACE_DEFAULTS.dark) {
    Object.assign(dark, DARK_TOKENS[surface.dark])
  }

  const pad = layer ? '    ' : '  '
  const outer = layer ? '  ' : ''
  const blocks: string[] = []
  const render = (selector: string, tokens: Record<string, string>) => {
    const lines = Object.entries(tokens).map(([name, value]) => `${pad}${name}: ${value};`)
    if (lines.length > 0) blocks.push(`${outer}${selector} {\n${lines.join('\n')}\n${outer}}`)
  }
  render(rootSelector, root)
  render(darkSelector, dark)

  if (blocks.length === 0) return ''
  const body = blocks.join('\n')
  return layer ? `@layer payload {\n${body}\n}` : body
}
