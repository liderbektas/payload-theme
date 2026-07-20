import { describe, expect, it } from 'vitest'

import { resolveOptions } from './options'
import { resolveFont } from './theme'

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
