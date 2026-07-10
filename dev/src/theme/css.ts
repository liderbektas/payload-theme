/**
 * Turn a computed {@link Theme} into CSS custom properties.
 *
 * This is the exact string the plugin will inject at runtime in Phase 4; for
 * now a small generator writes its output into `custom.scss`. The scale is
 * mode-independent so it is emitted once on the root selector; only the
 * semantic accent tokens are re-declared under the dark selector.
 */

import type { Theme } from './index'
import { SCALE_STEPS, type AccentTokens } from './index'

export interface ThemeCssOptions {
  /** Selector the base (light) tokens are declared on. Default `:root`. */
  rootSelector?: string
  /** Selector that scopes the dark-mode token overrides. Default `html[data-theme='dark']`. */
  darkSelector?: string
  /** Wrap the output in `@layer payload { ... }` so it wins over Payload's defaults. Default `true`. */
  layer?: boolean
  /** Indent string for nested declarations. Default two spaces. */
  indent?: string
  /**
   * Escape hatch: raw token overrides applied last, inside the root selector.
   * Keys may be given with or without the leading `--`.
   */
  cssVariables?: Record<string, string>
}

/** Order semantic tokens are emitted in; keys map to `--pt-<kebab>` names. */
const SEMANTIC_TOKENS: Array<[keyof AccentTokens, string]> = [
  ['accent', '--pt-accent'],
  ['accentHover', '--pt-accent-hover'],
  ['accentActive', '--pt-accent-active'],
  ['accentSubtle', '--pt-accent-subtle'],
  ['accentContrast', '--pt-accent-contrast'],
  ['accentRing', '--pt-accent-ring'],
]

const varLine = (name: string, value: string, pad: string): string => `${pad}${name}: ${value};`

function block(selector: string, lines: string[], pad: string): string {
  return `${pad}${selector} {\n${lines.join('\n')}\n${pad}}`
}

/** Emit the full 50..950 scale plus semantic light tokens for the root selector. */
function rootLines(theme: Theme, pad: string, extra?: Record<string, string>): string[] {
  const lines = SCALE_STEPS.map((step) => varLine(`--pt-accent-${step}`, theme.scale[step], pad))
  for (const [key, name] of SEMANTIC_TOKENS) lines.push(varLine(name, theme.light[key], pad))
  if (extra) {
    for (const [rawKey, value] of Object.entries(extra)) {
      const name = rawKey.startsWith('--') ? rawKey : `--${rawKey}`
      lines.push(varLine(name, value, pad))
    }
  }
  return lines
}

/** Emit only the semantic tokens that differ in dark mode. */
function darkLines(theme: Theme, pad: string): string[] {
  return SEMANTIC_TOKENS.map(([key, name]) => varLine(name, theme.dark[key], pad))
}

/**
 * Render a {@link Theme} to a CSS string of `--pt-*` custom properties for both
 * light and dark, ready to drop into a stylesheet.
 */
export function themeToCss(theme: Theme, opts: ThemeCssOptions = {}): string {
  const {
    rootSelector = ':root',
    darkSelector = "html[data-theme='dark']",
    layer = true,
    indent = '  ',
    cssVariables,
  } = opts

  const pad = layer ? indent : ''
  const inner = layer ? indent + indent : indent

  const root = block(rootSelector, rootLines(theme, inner, cssVariables), pad)
  const dark = block(darkSelector, darkLines(theme, inner), pad)
  const body = `${root}\n${dark}`

  return layer ? `@layer payload {\n${body}\n}` : body
}
