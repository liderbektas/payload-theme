'use client'

import type { I18n } from '@payloadcms/translations'

import { useTranslation } from '@payloadcms/ui'

import type { ThemeTFunction } from './types'

/**
 * Payload's `useTranslation`, with the theme's `payloadTheme:*` keys allowed.
 * The underlying `t` already resolves them: Payload deep-merges
 * `config.i18n.translations` into the client dictionary without filtering
 * custom namespaces, so nothing extra ships to the browser.
 */
export const useThemeTranslation = (): { i18n: I18n; t: ThemeTFunction } => {
  const { i18n } = useTranslation()
  const typed = i18n as I18n
  return { i18n: typed, t: typed.t as unknown as ThemeTFunction }
}
