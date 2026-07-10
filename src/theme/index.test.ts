import { describe, it, expect } from 'vitest'

import { buildTheme, TOKEN_STEPS } from './index'

describe('buildTheme', () => {
  it('normalizes the accent and returns a full 11-step scale', () => {
    const theme = buildTheme('#7C3AED')
    expect(theme.accent).toBe('#7c3aed')
    expect(Object.keys(theme.scale)).toHaveLength(11)
  })

  it('throws on invalid accent', () => {
    expect(() => buildTheme('mor')).toThrow(/Invalid accent color/)
  })

  it('maps light tokens off the darker rungs and dark tokens off the brighter rungs', () => {
    const theme = buildTheme('#2563eb')
    // Light primary = 600, dark primary = 400 (scale is not inverted).
    expect(theme.light.accent).toBe(theme.scale[TOKEN_STEPS.light.accent])
    expect(theme.dark.accent).toBe(theme.scale[TOKEN_STEPS.dark.accent])
    expect(theme.light.accent).toBe(theme.scale[600])
    expect(theme.dark.accent).toBe(theme.scale[400])
    // Hover/active follow the interaction direction of each mode.
    expect(theme.light.accentHover).toBe(theme.scale[700])
    expect(theme.light.accentActive).toBe(theme.scale[800])
    expect(theme.dark.accentHover).toBe(theme.scale[300])
    expect(theme.dark.accentActive).toBe(theme.scale[200])
  })

  it('picks a white contrast text on a purple primary', () => {
    const theme = buildTheme('#7c3aed')
    expect(theme.light.accentContrast).toBe('#ffffff')
  })

  it('picks a black contrast text on a yellow primary', () => {
    const theme = buildTheme('#eab308')
    expect(theme.light.accentContrast).toBe('#000000')
  })

  it('produces contrast text that is always black or white', () => {
    for (const hex of ['#e30613', '#10b981', '#2563eb', '#64748b', '#f59e0b', '#111827']) {
      const theme = buildTheme(hex)
      expect(['#000000', '#ffffff']).toContain(theme.light.accentContrast)
      expect(['#000000', '#ffffff']).toContain(theme.dark.accentContrast)
    }
  })
})
