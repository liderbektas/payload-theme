import type { ServerProps } from 'payload'

import { PayloadLogo } from '@payloadcms/ui/graphics/Logo'
import React from 'react'

import type { ResolvedThemeConfig } from '../../options'

/**
 * Login branding injected via `admin.components.beforeLogin`. Renders three
 * things:
 *
 * 1. the `--pt-*` accent tokens as a <style> — a SERVER concern on purpose:
 *    Payload strips `admin.custom` from the client config on unauthenticated
 *    pages (`createUnauthenticatedClientConfig`), so the ThemeProvider can't
 *    inject them here. This component reads the theme straight off the live
 *    `payload` instance it receives as a beforeLogin server prop.
 * 2. the always-dark brand panel (`.pt-login-hero`) — glow + grid + copy,
 *    no logo.
 * 3. the logo, centered above the login form and sized by
 *    `--pt-logo-height`: the user's own when a logo/icon option is
 *    configured, Payload's otherwise.
 *
 * The stylesheet switches the card to the split layout only when
 * `.pt-login-hero` exists, so forgot-password / reset keep the plain card.
 */
export const LoginHero: React.FC<ServerProps> = ({ payload }) => {
  const theme = payload?.config?.admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined

  const heading = theme?.login?.heading ?? 'Welcome back'
  const tagline = theme?.login?.tagline ?? 'Sign in to manage your content.'

  // The form column follows the viewer's color scheme, so keep the pair and
  // let CSS show the matching variant (same mechanism as the nav logo).
  const logo = theme?.logo ?? theme?.icon
  const logoIsPair = logo ? logo.dark !== logo.light : false

  return (
    <React.Fragment>
      {theme?.css ? (
        <style data-payload-theme="accent-login" dangerouslySetInnerHTML={{ __html: theme.css }} />
      ) : null}
      {theme?.fontURL ? (
        <link data-payload-theme="font-login" href={theme.fontURL} rel="stylesheet" />
      ) : null}
      <div aria-hidden="true" className="pt-login-hero">
        <div className="pt-login-hero__glow" />
        <div className="pt-login-hero__grid" />
        <div className="pt-login-hero__copy">
          <h2 className="pt-login-hero__heading">{heading}</h2>
          <p className="pt-login-hero__tagline">{tagline}</p>
        </div>
      </div>
      <div className="pt-login__logo">
        {logo ? (
          logoIsPair ? (
            <React.Fragment>
              {}
              <img
                alt=""
                className="pt-login__logo-img pt-login__logo-img--light"
                src={logo.light}
              />
              {}
              <img alt="" className="pt-login__logo-img pt-login__logo-img--dark" src={logo.dark} />
            </React.Fragment>
          ) : (
            <img alt="" className="pt-login__logo-img" src={logo.light} />
          )
        ) : (
          // No logo configured — Payload's own mark (follows the color scheme).
          <PayloadLogo />
        )}
      </div>
    </React.Fragment>
  )
}

export default LoginHero
