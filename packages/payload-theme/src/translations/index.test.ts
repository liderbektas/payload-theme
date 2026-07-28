import type { Config } from 'payload'

import { acceptedLanguages } from '@payloadcms/translations'
import { describe, expect, it } from 'vitest'

import { en } from './en'
import { THEME_I18N_NAMESPACE, THEME_TRANSLATIONS, withThemeTranslations } from './index'

const namespaceFor = (i18n: Config['i18n'], language: string) =>
  (i18n?.translations as Record<string, Record<string, Record<string, string>>>)?.[language]?.[
    THEME_I18N_NAMESPACE
  ]

describe('theme translations — locale files', () => {
  it('covers exactly the English key set in every locale', () => {
    const expected = Object.keys(en).sort()
    for (const [language, translations] of Object.entries(THEME_TRANSLATIONS)) {
      expect(Object.keys(translations).sort(), `locale '${language}'`).toEqual(expected)
    }
  })

  it('keeps every interpolation variable intact', () => {
    const variables = (value: string) => (value.match(/\{\{\s*\w+\s*\}\}/g) ?? []).sort()
    for (const [language, translations] of Object.entries(THEME_TRANSLATIONS)) {
      for (const key of Object.keys(en) as Array<keyof typeof en>) {
        expect(variables(translations[key]), `${language}.${key}`).toEqual(variables(en[key]))
      }
    }
  })

  it('ships no empty strings', () => {
    for (const [language, translations] of Object.entries(THEME_TRANSLATIONS)) {
      for (const [key, value] of Object.entries(translations)) {
        expect(value.trim(), `${language}.${key}`).not.toBe('')
      }
    }
  })
})

describe('withThemeTranslations', () => {
  it('registers the namespace for every language Payload accepts', () => {
    const i18n = withThemeTranslations(undefined)
    for (const language of acceptedLanguages) {
      expect(namespaceFor(i18n, language)?.onThisPage, `language '${language}'`).toBeTruthy()
    }
  })

  it('uses the translated strings where a locale ships, English where it does not', () => {
    const i18n = withThemeTranslations(undefined)
    expect(namespaceFor(i18n, 'de')?.onThisPage).toBe('Auf dieser Seite')
    expect(namespaceFor(i18n, 'tr')?.onThisPage).toBe('Bu sayfada')
    // 'ja' has no theme locale file yet — English rather than a raw key
    expect(namespaceFor(i18n, 'ja')?.onThisPage).toBe(en.onThisPage)
  })

  it("preserves the project's own translations, including its overrides of ours", () => {
    const i18n = withThemeTranslations({
      translations: {
        de: {
          custom: { hello: 'Hallo' },
          payloadTheme: { onThisPage: 'Inhalt' },
        },
      },
    } as Config['i18n'])

    expect(namespaceFor(i18n, 'de')?.onThisPage).toBe('Inhalt')
    // ...without dropping the keys the project did not override
    expect(namespaceFor(i18n, 'de')?.search).toBe('Suchen')
    expect(
      (i18n?.translations as Record<string, Record<string, Record<string, string>>>).de.custom
        .hello,
    ).toBe('Hallo')
  })

  it('leaves other i18n options untouched', () => {
    const i18n = withThemeTranslations({ fallbackLanguage: 'de' } as Config['i18n'])
    expect(i18n?.fallbackLanguage).toBe('de')
  })
})
