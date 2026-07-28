import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('payload-theme plugin', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('defaults to no dashboard widgets and registers no import-map dependencies', () => {
    const theme = payload.config.admin?.custom?.payloadTheme as {
      dashboard: { widgets: unknown[] }
    }
    expect(theme.dashboard.widgets).toEqual([])

    const dependencies = payload.config.admin?.dependencies ?? {}
    expect(Object.keys(dependencies).filter((key) => key.startsWith('payload-theme-widget'))).toEqual([])
  })

  it('registers its translation namespace without displacing Payload’s own', async () => {
    const translations = payload.config.i18n.translations as Record<
      string,
      Record<string, Record<string, string>>
    >

    // the theme's namespace, in the languages it ships…
    expect(translations.en.payloadTheme.onThisPage).toBe('On this page')
    expect(translations.de.payloadTheme.onThisPage).toBe('Auf dieser Seite')
    // …and English rather than a raw key everywhere else
    expect(translations.ja.payloadTheme.onThisPage).toBe('On this page')

    // End to end through Payload's own resolver, in the CLIENT context — the
    // one that filters built-ins against `clientTranslationKeys`. Custom
    // namespaces have to survive that filtering, or every theme string in the
    // browser would render as a raw `payloadTheme:*` key.
    const { initI18n } = await import('@payloadcms/translations')
    const { de } = await import('@payloadcms/translations/languages/de')
    const i18n = await initI18n({
      config: payload.config.i18n,
      context: 'client',
      language: 'de',
    })
    expect(i18n.t('payloadTheme:onThisPage' as 'general:dashboard')).toBe('Auf dieser Seite')
    // ...and Payload's own German is still intact alongside it
    expect(i18n.t('general:dashboard')).toBe(de.translations.general.dashboard)
  })
})
