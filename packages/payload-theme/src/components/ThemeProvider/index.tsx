'use client'

import { useConfig } from '@payloadcms/ui'
import React from 'react'

import type { ResolvedThemeConfig } from '../../options'

/**
 * Injects the computed accent scale (`--pt-*` custom properties) that the
 * static stylesheet reads. Registered in `admin.components.providers`, it sits
 * inside Payload's ConfigProvider, so it reads the precomputed CSS string off
 * `admin.custom.payloadTheme` and renders it into a <style> — server-rendered
 * in the initial HTML, so there's no flash of unthemed color.
 */
export const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig()
  const theme = config.admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined

  return (
    <React.Fragment>
      {theme?.css ? (
        <style data-payload-theme="accent" dangerouslySetInnerHTML={{ __html: theme.css }} />
      ) : null}
      {theme?.fontURL ? (
        <link data-payload-theme="font" href={theme.fontURL} rel="stylesheet" />
      ) : null}
      {children}
    </React.Fragment>
  )
}

export default ThemeProvider
