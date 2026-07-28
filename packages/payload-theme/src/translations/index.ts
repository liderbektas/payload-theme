/**
 * The theme's own translation namespace (`payloadTheme:*`).
 *
 * Payload merges anything under `config.i18n.translations[language]` on top of
 * its built-in dictionary at request time, and — unlike the built-ins — custom
 * keys are NOT filtered against `clientTranslationKeys`, so the same namespace
 * reaches server components and the browser alike. `i18n` is a server-only
 * config property (Payload strips it from the client config), so registering
 * every language costs nothing in the client bundle.
 *
 * Strings Payload already ships are reused straight from its namespaces
 * (`general:close`, `general:locale`, `authentication:logOut`, …); this file
 * only covers what the theme adds.
 */

import type { AcceptedLanguages, GenericTranslationsObject } from '@payloadcms/translations'
import type { Config } from 'payload'

import { acceptedLanguages } from '@payloadcms/translations'

import type { ThemeTranslations } from './en'

import { de } from './de'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { nl } from './nl'
import { pt } from './pt'
import { tr } from './tr'

/** The namespace key every theme string lives under. */
export const THEME_I18N_NAMESPACE = 'payloadTheme'

/**
 * Shipped locales. Anything Payload accepts but this map does not cover falls
 * back to English rather than rendering raw `payloadTheme:*` keys — new
 * translations are one file plus one line here.
 */
export const THEME_TRANSLATIONS: Partial<Record<AcceptedLanguages, ThemeTranslations>> = {
  de,
  en,
  es,
  fr,
  it,
  nl,
  pt,
  tr,
}

/**
 * Merge the theme namespace into `config.i18n.translations` for every language
 * Payload accepts, preserving anything already there.
 *
 * Precedence per language: English base → that language's file → whatever the
 * project already defined. The user's own `payloadTheme:*` overrides therefore
 * always win, which makes this the supported way to reword the theme's copy
 * without touching a component.
 */
export function withThemeTranslations(i18n: Config['i18n']): Config['i18n'] {
  const existing = (i18n?.translations ?? {}) as Record<string, GenericTranslationsObject>
  const translations: Record<string, GenericTranslationsObject> = { ...existing }

  for (const language of acceptedLanguages) {
    const projectNamespace = existing[language]?.[THEME_I18N_NAMESPACE]
    translations[language] = {
      ...existing[language],
      [THEME_I18N_NAMESPACE]: {
        ...en,
        ...THEME_TRANSLATIONS[language],
        ...(typeof projectNamespace === 'object' ? projectNamespace : {}),
      },
    }
  }

  return { ...i18n, translations } as Config['i18n']
}

export { en } from './en'
export type { ThemeTranslationKey, ThemeTranslations } from './en'
