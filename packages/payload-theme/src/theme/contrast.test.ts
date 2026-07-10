import { describe, it, expect } from 'vitest'

import { relativeLuminance, contrastRatio, pickContrastText, pickContrastTextForHex } from './contrast'

describe('relativeLuminance', () => {
  it('is 1 for white and 0 for black', () => {
    expect(relativeLuminance({ r: 1, g: 1, b: 1 })).toBeCloseTo(1, 6)
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 6)
  })

  it('ranks green brighter than blue', () => {
    expect(relativeLuminance({ r: 0, g: 1, b: 0 })).toBeGreaterThan(
      relativeLuminance({ r: 0, g: 0, b: 1 }),
    )
  })
})

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 })).toBeCloseTo(21, 4)
  })

  it('is 1:1 for identical colors and order-independent', () => {
    const c = { r: 0.4, g: 0.2, b: 0.9 }
    expect(contrastRatio(c, c)).toBeCloseTo(1, 6)
    const a = { r: 0.1, g: 0.1, b: 0.1 }
    const b = { r: 0.9, g: 0.9, b: 0.9 }
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10)
  })
})

describe('pickContrastText — the core requirement', () => {
  it('chooses BLACK text on a yellow accent', () => {
    const choice = pickContrastTextForHex('#ffd700')!
    expect(choice.color).toBe('#000000')
    expect(choice.meetsAA).toBe(true)
  })

  it('chooses WHITE text on a purple accent', () => {
    const choice = pickContrastTextForHex('#7c3aed')!
    expect(choice.color).toBe('#ffffff')
    expect(choice.meetsAA).toBe(true)
  })

  it('chooses BLACK on white and WHITE on black', () => {
    expect(pickContrastText({ r: 1, g: 1, b: 1 }).color).toBe('#000000')
    expect(pickContrastText({ r: 0, g: 0, b: 0 }).color).toBe('#ffffff')
  })

  it('always returns the higher-contrast option', () => {
    for (const hex of ['#e30613', '#10b981', '#2563eb', '#64748b', '#f59e0b']) {
      const c = pickContrastTextForHex(hex)!
      expect(['#000000', '#ffffff']).toContain(c.color)
      expect(c.ratio).toBeGreaterThan(1)
    }
  })

  it('returns null for invalid hex', () => {
    expect(pickContrastTextForHex('nope')).toBeNull()
  })
})
