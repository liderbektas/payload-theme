import { describe, it, expect } from 'vitest'

import { buildTheme } from './index'
import { themeToCss } from './css'

const theme = buildTheme('#7c3aed')

describe('themeToCss', () => {
  it('emits the full 50..950 scale on the root selector', () => {
    const css = themeToCss(theme)
    for (const step of [50, 100, 500, 900, 950] as const) {
      expect(css).toContain(`--pt-accent-${step}: ${theme.scale[step]};`)
    }
  })

  it('emits light semantic tokens in the root and dark overrides in the dark selector', () => {
    const css = themeToCss(theme)
    expect(css).toContain(`--pt-accent: ${theme.light.accent};`)
    expect(css).toContain(`--pt-accent-contrast: ${theme.light.accentContrast};`)
    // Dark block re-declares the primary off the brighter rung.
    expect(css).toContain("html[data-theme='dark'] {")
    expect(css).toContain(`--pt-accent: ${theme.dark.accent};`)
    expect(theme.dark.accent).not.toBe(theme.light.accent)
  })

  it('wraps output in @layer payload by default and can opt out', () => {
    expect(themeToCss(theme)).toContain('@layer payload {')
    const bare = themeToCss(theme, { layer: false })
    expect(bare).not.toContain('@layer')
    expect(bare).toContain(':root {')
  })

  it('honors custom root and dark selectors', () => {
    const css = themeToCss(theme, { rootSelector: '.pt', darkSelector: '.pt-dark' })
    expect(css).toContain('.pt {')
    expect(css).toContain('.pt-dark {')
  })

  it('applies the cssVariables escape hatch, normalizing the -- prefix', () => {
    const css = themeToCss(theme, {
      cssVariables: { '--pt-accent': '#ff0000', 'pt-accent-ring': '#00ff00' },
    })
    expect(css).toContain('--pt-accent: #ff0000;')
    expect(css).toContain('--pt-accent-ring: #00ff00;')
  })

  it('produces balanced braces', () => {
    const css = themeToCss(theme)
    expect((css.match(/{/g) ?? []).length).toBe((css.match(/}/g) ?? []).length)
  })
})
