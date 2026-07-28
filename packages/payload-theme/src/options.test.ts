import { describe, expect, it } from 'vitest'

import { resolveOptions, THEME_PRESETS } from './options'
import { resolveFont } from './theme'

describe('resolveOptions — preset', () => {
  it('resolves to null when the option is omitted, leaving the plain defaults', () => {
    const { resolved } = resolveOptions({})
    expect(resolved.preset).toBeNull()
    expect(resolved.accent).toBe('#4f4ece')
    expect(resolved.radius).toBe('md')
    expect(resolved.font).toBe('default')
  })

  it('applies every part of a preset — accent, radius and font together', () => {
    for (const preset of THEME_PRESETS) {
      const { resolved } = resolveOptions({ preset: preset.key })
      expect(resolved.preset).toBe(preset.key)
      expect(resolved.accent).toBe(preset.accent)
      expect(resolved.radius).toBe(preset.radius)
      expect(resolved.font).toBe(preset.font)
    }
  })

  it('lets explicit options override the preset, part by part', () => {
    const { resolved } = resolveOptions({ preset: 'ocean', accent: '#e30613' })
    expect(resolved.accent).toBe('#e30613')
    // untouched parts still come from Ocean
    expect(resolved.radius).toBe('lg')
    expect(resolved.font).toBe('inter')
    expect(resolved.preset).toBe('ocean')

    const radiusOverride = resolveOptions({ preset: 'swiss', radius: 'full' }).resolved
    expect(radiusOverride.radius).toBe('full')
    expect(radiusOverride.accent).toBe('#dc2626')
  })

  it("drives the radius tokens through the preset's radius", () => {
    const { cssVariables } = resolveOptions({ preset: 'swiss' }) // radius: 'none'
    expect(cssVariables?.['--pt-radius-ctl']).toBe('0px')
    expect(cssVariables?.['--pt-radius-card']).toBe('0px')
  })

  it('rejects an unknown preset by name, listing the valid ones', () => {
    expect(() => resolveOptions({ preset: 'soft' as 'zinc' })).toThrow(/Invalid preset: 'soft'/)
    expect(() => resolveOptions({ preset: 'soft' as 'zinc' })).toThrow(/zinc.*ocean/)
  })
})

describe('resolveOptions — font', () => {
  it("defaults to 'default' with no webfont URL", () => {
    const { resolved } = resolveOptions({})
    expect(resolved.font).toBe('default')
    expect(resolved.fontURL).toBeNull()
  })

  it('resolves built-in webfont keys to a Google Fonts URL', () => {
    for (const key of ['inter', 'geist'] as const) {
      const { resolved } = resolveOptions({ font: key })
      expect(resolved.font).toBe(key)
      expect(resolved.fontURL).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?family=/)
    }
  })

  it('resolves pure-stack keys with no URL', () => {
    for (const key of ['helvetica', 'system'] as const) {
      const { resolved } = resolveOptions({ font: key })
      expect(resolved.fontURL).toBeNull()
      expect(resolveFont(key).stack).toBeTruthy()
    }
  })

  it('passes a custom font-family stack through verbatim', () => {
    const stack = "'Satoshi', sans-serif"
    const { resolved } = resolveOptions({ font: stack })
    expect(resolved.font).toBe(stack)
    expect(resolved.fontURL).toBeNull()
    expect(resolveFont(stack)).toEqual({ stack, url: null })
  })

  it('rejects an empty font string', () => {
    expect(() => resolveOptions({ font: '  ' })).toThrow(/font/)
  })
})

describe('resolveOptions — dashboard.widgets', () => {
  it('defaults to an empty widget list when the option is omitted', () => {
    expect(resolveOptions({}).resolved.dashboard.widgets).toEqual([])
    expect(resolveOptions({ dashboard: {} }).resolved.dashboard.widgets).toEqual([])
  })

  it('normalizes a bare component path string', () => {
    const { resolved } = resolveOptions({
      dashboard: { widgets: ['/components/LastLogin#LastLogin'] },
    })
    expect(resolved.dashboard.widgets).toEqual([
      { component: '/components/LastLogin#LastLogin', width: 'half' },
    ])
  })

  it('normalizes a { path, exportName } component object', () => {
    const component = { exportName: 'Stats', path: '/components/Stats' }
    const { resolved } = resolveOptions({ dashboard: { widgets: [component] } })
    expect(resolved.dashboard.widgets).toEqual([{ component, width: 'half' }])
  })

  it('keeps an explicit width from the { component, width } form', () => {
    const { resolved } = resolveOptions({
      dashboard: {
        widgets: [
          { component: '/components/Stats#Stats', width: 'full' },
          { component: '/components/Tiny#Tiny', width: 'third' },
          { component: '/components/Mid#Mid' },
        ],
      },
    })
    expect(resolved.dashboard.widgets.map((w) => w.width)).toEqual(['full', 'third', 'half'])
  })

  it('rejects invalid widget entries with a clear error', () => {
    expect(() => resolveOptions({ dashboard: { widgets: ['' as string] } })).toThrow(
      /dashboard\.widgets\[0\]/,
    )
    expect(() =>
      resolveOptions({ dashboard: { widgets: [{ component: 42 as unknown as string }] } }),
    ).toThrow(/dashboard\.widgets\[0\]\.component/)
    expect(() =>
      resolveOptions({
        dashboard: { widgets: [{ component: '/x#X', width: 'huge' as 'full' }] },
      }),
    ).toThrow(/width/)
    expect(() => resolveOptions({ dashboard: { widgets: {} as unknown as [] } })).toThrow(
      /must be an array/,
    )
  })
})
