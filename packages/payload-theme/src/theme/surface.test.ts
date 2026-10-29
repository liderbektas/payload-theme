import { describe, expect, it } from 'vitest'

import { NEUTRAL_PALETTES, neutralLadder, SURFACE_DEFAULTS, surfaceToCss } from './surface'

describe('neutralLadder', () => {
  it('fills all 21 rungs Payload derives its elevation scale from', () => {
    const ladder = neutralLadder('slate')
    expect(
      Object.keys(ladder)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual([
      0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900,
      950, 1000,
    ])
    expect(ladder[500]).toBe(NEUTRAL_PALETTES.slate[500])
  })

  it('interpolates the in-between rungs as channel midpoints', () => {
    // zinc 100 #f4f4f5 + 200 #e4e4e7 → #ececee (the stylesheet's own 150)
    expect(neutralLadder('zinc')[150]).toBe('#ececee')
  })
})

describe('surfaceToCss', () => {
  it('emits nothing for the defaults — the stylesheet already carries them', () => {
    expect(surfaceToCss(SURFACE_DEFAULTS)).toBe('')
  })

  it('emits only the tokens of the options that differ', () => {
    const css = surfaceToCss({ ...SURFACE_DEFAULTS, density: 'compact' })
    expect(css).toContain('--pt-ctl-h: 34px;')
    expect(css).not.toContain('--color-base-')
    expect(css).not.toContain('--pt-frame-')
    expect(css).not.toContain("html[data-theme='dark']")
  })

  it('retints the base ladder and the gray field for a non-zinc neutral', () => {
    const css = surfaceToCss({ ...SURFACE_DEFAULTS, neutral: 'stone' })
    expect(css).toContain(`--color-base-500: ${NEUTRAL_PALETTES.stone[500]};`)
    expect(css).toContain('--theme-bg: var(--color-base-100);')
  })

  it('declares the dim elevation remap under the dark selector', () => {
    const css = surfaceToCss({ ...SURFACE_DEFAULTS, dark: 'dim' })
    expect(css).toMatch(
      /html\[data-theme='dark'\] \{[^}]*--theme-elevation-0: var\(--color-base-900\);/,
    )
  })

  it('flattens the frame through its tokens', () => {
    const css = surfaceToCss({ ...SURFACE_DEFAULTS, frame: 'flat' })
    expect(css).toContain('--pt-frame-inset: 0px;')
    expect(css).toContain('--pt-frame-radius: 0px;')
  })

  it('spells out every token in full mode, on the selectors it is given', () => {
    const css = surfaceToCss(SURFACE_DEFAULTS, {
      darkSelector: "html[data-theme='dark']:root",
      full: true,
      rootSelector: ':root:root',
    })
    expect(css).toContain(':root:root {')
    expect(css).toContain("html[data-theme='dark']:root {")
    expect(css).toContain('--theme-bg: #f4f4f6;')
    expect(css).toContain('--pt-ctl-h: 40px;')
    expect(css).toContain('--pt-frame-inset: 8px;')
  })
})
