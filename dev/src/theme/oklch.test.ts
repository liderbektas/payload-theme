import { describe, it, expect } from 'vitest'

import {
  hexToRgb,
  rgbToHex,
  rgbToOklch,
  hexToOklch,
  oklchToHex,
  oklchToRgbGamut,
  oklchToRgbRaw,
  srgbToLinear,
  linearToSrgb,
} from './oklch'

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 1, g: 1, b: 1 })
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('parses 3-digit shorthand', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 1, g: 1, b: 1 })
    expect(hexToRgb('#f00')).toEqual({ r: 1, g: 0, b: 0 })
  })

  it('is case-insensitive and tolerates a missing hash', () => {
    expect(hexToRgb('7C3AED')).toEqual(hexToRgb('#7c3aed'))
  })

  it('returns null for malformed input', () => {
    expect(hexToRgb('mor')).toBeNull()
    expect(hexToRgb('#12')).toBeNull()
    expect(hexToRgb('#1234')).toBeNull()
    expect(hexToRgb('#gggggg')).toBeNull()
    expect(hexToRgb('')).toBeNull()
    // @ts-expect-error runtime guard for non-string input
    expect(hexToRgb(null)).toBeNull()
  })
})

describe('rgbToHex', () => {
  it('serializes to lowercase #rrggbb', () => {
    expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe('#ff0000')
    expect(rgbToHex({ r: 0.5, g: 0.5, b: 0.5 })).toBe('#808080')
  })

  it('clamps out-of-range channels', () => {
    expect(rgbToHex({ r: 2, g: -1, b: 0.5 })).toBe('#ff0080')
  })

  it('round-trips a handful of colors', () => {
    for (const hex of ['#7c3aed', '#e30613', '#10b981', '#1e293b']) {
      expect(rgbToHex(hexToRgb(hex)!)).toBe(hex)
    }
  })
})

describe('sRGB gamma', () => {
  it('inverts cleanly across the range', () => {
    // Values off the piecewise breakpoint (~0.04045) round-trip to full precision.
    for (const c of [0, 0.02, 0.2, 0.5, 0.8, 1]) {
      expect(linearToSrgb(srgbToLinear(c))).toBeCloseTo(c, 10)
    }
  })
})

describe('rgbToOklch', () => {
  it('maps white to L=1, C=0', () => {
    const { L, C } = rgbToOklch({ r: 1, g: 1, b: 1 })
    expect(L).toBeCloseTo(1, 4)
    expect(C).toBeCloseTo(0, 4)
  })

  it('maps black to L=0', () => {
    expect(rgbToOklch({ r: 0, g: 0, b: 0 }).L).toBeCloseTo(0, 4)
  })

  it('reports a positive chroma and sane hue for a saturated color', () => {
    const { C, H } = hexToOklch('#e30613')! // red
    expect(C).toBeGreaterThan(0.1)
    expect(H).toBeGreaterThanOrEqual(0)
    expect(H).toBeLessThan(360)
  })
})

describe('OKLCH round-trip', () => {
  it('recovers in-gamut colors through hex', () => {
    for (const hex of ['#7c3aed', '#e30613', '#10b981', '#2563eb', '#f59e0b']) {
      expect(oklchToHex(hexToOklch(hex)!)).toBe(hex)
    }
  })
})

describe('gamut mapping', () => {
  it('keeps an out-of-gamut request inside 0..1 by reducing chroma', () => {
    // A very high chroma at high lightness is not representable in sRGB.
    const impossible = { L: 0.95, C: 0.4, H: 30 }
    expect(oklchToRgbRaw(impossible).r).toBeGreaterThan(1) // confirm it overshoots
    const mapped = oklchToRgbGamut(impossible)
    for (const v of [mapped.r, mapped.g, mapped.b]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('preserves lightness while desaturating', () => {
    const target = { L: 0.6, C: 0.5, H: 250 }
    const mapped = oklchToRgbGamut(target)
    const back = rgbToOklch(mapped)
    expect(back.L).toBeCloseTo(target.L, 2)
    expect(back.C).toBeLessThan(target.C)
  })
})
