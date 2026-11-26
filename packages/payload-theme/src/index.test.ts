import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import type { ResolvedThemeConfig } from './options.js'

import { payloadTheme } from './index.js'

const injectedCss = async (options: Parameters<typeof payloadTheme>[0]) => {
  const config = await payloadTheme(options)({} as Config)
  return (config.admin?.custom?.payloadTheme as ResolvedThemeConfig).css
}

describe('payloadTheme — injected CSS', () => {
  it('has no docked-sidebar band by default', async () => {
    expect(await injectedCss({})).not.toContain('--nav-width')
  })

  it('adds the docked band when nav.dockedMinWidth is set', async () => {
    const css = await injectedCss({ nav: { dockedMinWidth: 1280 } })
    expect(css).toContain('@media (min-width: 1280px) and (max-width: 1440px)')
  })
})
