import { describe, expect, it } from 'vitest'

import { iconNodeOf } from './iconNode'

const node = [
  ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', key: '1yyitq' }],
  ['circle', { cx: '9', cy: '7', key: 'nufk8', r: '4' }],
]

describe('iconNodeOf', () => {
  it('reads `__iconNode` (lucide-react <= 1.41)', () => {
    expect(iconNodeOf({ __iconNode: node, default: () => null })).toBe(node)
  })

  it('reads `__iconData.node` (lucide-react >= 1.42)', () => {
    const mod = { __iconData: { name: 'users', node, size: 24 }, default: () => null }
    expect(iconNodeOf(mod)).toBe(node)
  })

  it('returns undefined for a module without geometry', () => {
    expect(iconNodeOf({ default: () => null })).toBeUndefined()
    expect(iconNodeOf({ __iconData: { name: 'users' } })).toBeUndefined()
    expect(iconNodeOf({ __iconNode: 'not-an-array' })).toBeUndefined()
    expect(iconNodeOf(undefined)).toBeUndefined()
  })
})
