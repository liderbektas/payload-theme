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
 * 3. registers dashboard widgets in `admin.dependencies` so the import-map
 *    generator picks them up,
 * 4. registers the custom Nav, Dashboard and the accent-injecting provider.
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

    // Widgets are referenced by import-map path (like every Payload component).
    // `admin.custom` isn't crawled by `generate:importmap`, so declare each one
    // in `admin.dependencies` — the generator's explicit escape hatch.
    if (resolved.dashboard.widgets.length > 0) {
      config.admin.dependencies = { ...config.admin.dependencies }
      resolved.dashboard.widgets.forEach((widget, index) => {
        // resolveOptions guarantees a string or `{ path }` object (never `false`).
        const component = widget.component as string | { exportName?: string; path: string }
        const path =
          typeof component === 'string'
            ? component
            : `${component.path}${component.exportName ? `#${component.exportName}` : ''}`
        config.admin!.dependencies![`payload-theme-widget-${index}`] = {
          type: 'component',
          path,
        }
      })
    }

    const components = { ...config.admin.components }
    components.Nav = 'payload-theme/client#Nav'
    components.providers = [...(components.providers ?? []), 'payload-theme/client#ThemeProvider']
    // Renders the split-layout brand panel on the login view; the stylesheet
    // only switches to the two-column card when this element is present.
    // A server component: unauthenticated pages get a stripped client config
    // (no admin.custom), so the hero reads the theme from `payload` directly.
    components.beforeLogin = [...(components.beforeLogin ?? []), 'payload-theme/rsc#LoginHero']
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
export type {
  DashboardOptions,
  DashboardWidget,
  DashboardWidgetServerProps,
  DashboardWidgetWidth,
  NavOptions,
  PayloadThemeOptions,
  ThemePreset,
  ThemeRadius,
} from './options'
