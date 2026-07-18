import { describe, it, expect } from 'vitest'

import { isValidHex, normalizeHex } from './validate'

describe('isValidHex', () => {
  it('accepts 3- and 6-digit hex, with or without a hash', () => {
    for (const v of ['#fff', '#ffffff', 'fff', 'FFFFFF', '#7c3aed', '  #7c3aed  ']) {
      expect(isValidHex(v)).toBe(true)
    }
  })

  it('rejects anything else', () => {
    for (const v of ['mor', '#12', '#1234', '#gggggg', 'rgb(0,0,0)', '', 42, null, undefined, {}]) {
      expect(isValidHex(v)).toBe(false)
    }
  })
})

describe('normalizeHex', () => {
  it('canonicalizes to lowercase #rrggbb', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff')
    expect(normalizeHex('7C3AED')).toBe('#7c3aed')
    expect(normalizeHex('  #E30613 ')).toBe('#e30613')
  })

  it('throws a descriptive error for a bad string, echoing the input', () => {
    expect(() => normalizeHex('mor')).toThrow(
      "Invalid accent color: 'mor'. Expected hex like #7c3aed",
    )
  })

  it('uses the provided label in the message', () => {
    expect(() => normalizeHex('#12', 'ring color')).toThrow(/Invalid ring color:/)
  })

  it('throws for non-string input', () => {
    expect(() => normalizeHex(123)).toThrow(/Invalid accent color: 123/)
  })
})
