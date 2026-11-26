import type { I18n } from '@payloadcms/translations'

import { describe, expect, it } from 'vitest'

import { en } from './en.js'
import { fr } from './fr.js'
import { pt } from './pt.js'
import { ru } from './ru.js'
import { themePlural } from './types.js'

// Mirrors Payload's `getTranslationString` thresholds, the resolver `themePlural`
// falls back to: only `_one` for 1, `_few` for 3-5, `_many` above 5.
const fakeI18n = (language: string, namespace: Record<string, string>): I18n =>
  ({
    language,
    t: (_key: string, vars: { count: number }) => {
      const { count } = vars
      if (count === 1 && 'documentCount_one' in namespace) return namespace.documentCount_one
      if (count > 5 && 'documentCount_many' in namespace) return namespace.documentCount_many
      if (count > 2 && count <= 5 && 'documentCount_few' in namespace)
        return namespace.documentCount_few
      return namespace.documentCount_other
    },
    translations: { payloadTheme: namespace },
  }) as unknown as I18n

describe('themePlural', () => {
  it('inflects Russian by CLDR rules, not by Payload thresholds', () => {
    const i18n = fakeI18n('ru', ru as Record<string, string>)
    const noun = (count: number) => themePlural(i18n, 'documentCount', count)
    expect(noun(1)).toBe('документ')
    expect(noun(2)).toBe('документа')
    expect(noun(5)).toBe('документов')
    expect(noun(11)).toBe('документов')
    expect(noun(21)).toBe('документ')
    expect(noun(22)).toBe('документа')
    expect(noun(192)).toBe('документа')
    expect(noun(0)).toBe('документов')
  })

  it('leaves one/other languages to Payload, including 0 (fr/pt are singular at 0 in CLDR)', () => {
    for (const [language, namespace] of [
      ['fr', fr],
      ['pt', pt],
    ] as const) {
      const i18n = fakeI18n(language, namespace as Record<string, string>)
      expect(themePlural(i18n, 'documentCount', 0), language).toBe(namespace.documentCount_other)
      expect(themePlural(i18n, 'documentCount', 1), language).toBe(namespace.documentCount_one)
    }
  })

  it('leaves en to Payload', () => {
    const i18n = fakeI18n('en', en as Record<string, string>)
    expect(themePlural(i18n, 'documentCount', 1)).toBe('document')
    expect(themePlural(i18n, 'documentCount', 0)).toBe('documents')
    expect(themePlural(i18n, 'documentCount', 7)).toBe('documents')
  })
})
