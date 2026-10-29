import { describe, expect, it, vi } from 'vitest'

import { loadIconNodes, THEME_UI_ICONS } from './icons'

vi.mock('lucide-react/dynamicIconImports.mjs', async (importOriginal) => {
  const real = (await importOriginal<{ default: Record<string, () => Promise<unknown>> }>()).default
  return {
    default: {
      ...real,
      // the lucide-react >= 1.42 module shape: geometry under __iconData.node
      'new-shape': async () => ({
        __iconData: { name: 'new-shape', node: [['path', { d: 'M0 0' }]] },
      }),
    },
  }
})

describe('loadIconNodes', () => {
  it("resolves every icon the theme's own UI draws", async () => {
    const nodes = await loadIconNodes(THEME_UI_ICONS)
    expect(Object.keys(nodes).sort()).toEqual([...THEME_UI_ICONS].sort())
    // plain [element, attributes] tuples — serializable onto admin.custom
    expect(nodes.palette?.[0]?.[0]).toBe('path')
    expect(JSON.parse(JSON.stringify(nodes))).toEqual(nodes)
  })

  it('skips unknown names and deduplicates', async () => {
    const nodes = await loadIconNodes(['folder', 'folder', 'not-a-lucide-icon'])
    expect(Object.keys(nodes)).toEqual(['folder'])
  })

  it('reads the lucide-react >= 1.42 module shape (`__iconData.node`)', async () => {
    const nodes = await loadIconNodes(['new-shape'])
    expect(nodes['new-shape']).toEqual([['path', { d: 'M0 0' }]])
  })
})
