/**
 * payload-theme — a single-accent theme for the Payload
 * admin panel. Drop it into your `plugins` array, add one CSS import, and the
 * whole panel is restyled and recolored from one accent hex.
 *
 * @example
 * import { payloadTheme } from 'payload-theme'
 *
 * export default buildConfig({
 *   plugins: [
 *     payloadTheme({
 *       accent: '#e30613',
 *       logo: '/logo.svg',
 *       nav: { icons: { posts: 'newspaper', users: 'users' } },
 *     }),
 *   ],
 * })
 */

import type { Config } from 'payload'

import { resolveOptions, type PayloadThemeOptions } from './options'
import { buildTheme, themeToCss } from './theme'

/**
 * The plugin factory. Returns a Payload config transform that:
 * 1. validates options and computes the accent scale (once, at init),
 * 2. stashes the serializable theme config on `admin.custom.payloadTheme`,
 * 3. registers the custom Nav, Dashboard and the accent-injecting provider.
 */
export const payloadTheme =
  (options: PayloadThemeOptions = {}) =>
  (incoming: Config): Config => {
    const { accent, cssVariables, resolved } = resolveOptions(options)

    // Compute the --pt-* tokens once here on the server; the ThemeProvider
    // renders them into a <style> so a single hex recolors every rule.
    resolved.css = themeToCss(buildTheme(accent), { cssVariables })

    const config: Config = { ...incoming }
    config.admin = config.admin ?? {}
    config.admin.custom = { ...config.admin.custom, payloadTheme: resolved }

    const components = { ...config.admin.components }
    components.Nav = 'payload-theme/client#Nav'
    components.providers = [...(components.providers ?? []), 'payload-theme/client#ThemeProvider']
    components.views = {
      ...components.views,
      dashboard: {
        ...(components.views?.dashboard as object),
        Component: 'payload-theme/rsc#Dashboard',
      },
    }
    config.admin.components = components

    return config
  }

export default payloadTheme
export type { NavOptions, PayloadThemeOptions, ThemePreset, ThemeRadius } from './options'
