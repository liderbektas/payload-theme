/**
 * The typed `t` the theme's components use. Kept in its own module (no
 * `'use client'`, no runtime imports beyond the type) so server components can
 * pull `themeT` without dragging the locale dictionaries or a client boundary
 * along.
 */

import type { DefaultTranslationKeys, I18n, I18nClient } from '@payloadcms/translations'

import type { ThemeTranslationKey } from './en'

/**
 * A `t` that accepts the theme's own `payloadTheme:*` keys alongside every
 * built-in Payload key. Payload types `t` against `DefaultTranslationKeys`
 * only, so the widened signature is asserted once here instead of at every
 * call site — the keys themselves stay checked, because `ThemeTranslationKey`
 * is derived from the English source file.
 */
export type ThemeTFunction = (
  key: DefaultTranslationKeys | ThemeTranslationKey,
  vars?: Record<string, unknown>,
) => string

/**
 * Widen an `i18n.t` from a server component (Dashboard, LoginHero). Both
 * contexts resolve `payloadTheme:*`: Payload filters its own dictionary
 * against `clientTranslationKeys`, then merges `config.i18n.translations` on
 * top without filtering custom namespaces.
 */
export const themeT = (i18n: I18n | I18nClient): ThemeTFunction =>
  i18n.t as unknown as ThemeTFunction
