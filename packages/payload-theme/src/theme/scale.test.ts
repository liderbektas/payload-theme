import { describe, it, expect } from 'vitest'

import { hexToOklch } from './oklch'
import { generateScale, generateScaleOklch, SCALE_STEPS } from './scale'

const PURPLE = hexToOklch('#7c3aed')!

describe('generateScale', () => {
  it('produces all 11 steps as valid hex', () => {
    const scale = generateScale(PURPLE)
    expect(
      Object.keys(scale)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([...SCALE_STEPS])
    for (const step of SCALE_STEPS) {
      expect(scale[step]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('generateScaleOklch', () => {
  it('has strictly decreasing lightness from 50 to 950', () => {
    const oklch = generateScaleOklch(PURPLE)
    for (let i = 1; i < SCALE_STEPS.length; i++) {
      expect(oklch[SCALE_STEPS[i]].L).toBeLessThan(oklch[SCALE_STEPS[i - 1]].L)
    }
  })

  it('preserves the seed hue across every step', () => {
    const oklch = generateScaleOklch(PURPLE)
    for (const step of SCALE_STEPS) {
      expect(oklch[step].H).toBeCloseTo(PURPLE.H, 6)
    }
  })

  it('peaks chroma in the mid tones and tapers at both ends', () => {
    const oklch = generateScaleOklch(PURPLE)
    expect(oklch[500].C).toBeGreaterThan(oklch[50].C)
    expect(oklch[500].C).toBeGreaterThan(oklch[950].C)
  })

  it('scales chroma with the vividness of the seed', () => {
    const vivid = generateScaleOklch(hexToOklch('#7c3aed')!)
    const muted = generateScaleOklch(hexToOklch('#8b8194')!) // desaturated purple-gray
    expect(muted[500].C).toBeLessThan(vivid[500].C)
  })

  it('keeps a near-neutral seed near-neutral throughout', () => {
    const gray = generateScaleOklch(hexToOklch('#808080')!)
    for (const step of SCALE_STEPS) {
      expect(gray[step].C).toBeLessThan(0.02)
    }
  })
})
