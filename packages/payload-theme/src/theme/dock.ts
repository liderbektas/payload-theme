/**
 * Docked sidebar on laptop widths — the `nav.dockedMinWidth` option.
 *
 * Payload hard-codes its `l` breakpoint at 1440px (`WindowInfoProvider` in
 * `@payloadcms/ui`) and its `NavProvider` force-closes the nav at or below it,
 * and the stylesheet turns the same range into an overlay drawer. The option
 * lowers the drawer's ceiling: from `dockedMinWidth` up to 1440px the sidebar
 * is docked like it is above 1440px, below it the drawer stays.
 *
 * Pure and dependency-free, like `surface.ts`: the plugin renders the CSS into
 * the ThemeProvider's <style> on the server (so the first paint is already
 * docked) and the Nav reads the same media queries on the client.
 */

/** Payload's `l` breakpoint: at or below it Payload treats the nav as a drawer. */
export const DRAWER_MAX_WIDTH = 1440

/** Payload's `m` breakpoint is 1024px: tablets and below always keep the drawer. */
export const DOCKED_MIN_WIDTH_FLOOR = 1025

/** The widths where the option docks the sidebar, e.g. `(min-width: 1280px) and (max-width: 1440px)`. */
export const dockedBandQuery = (minWidth: number): string =>
  `(min-width: ${minWidth}px) and (max-width: ${DRAWER_MAX_WIDTH}px)`

/** The widths where the sidebar is still an overlay drawer. */
export const drawerQuery = (dockedMinWidth: null | number): string =>
  dockedMinWidth === null
    ? `(max-width: ${DRAWER_MAX_WIDTH}px)`
    : `(max-width: ${DRAWER_MAX_WIDTH}px) and (not (min-width: ${dockedMinWidth}px))`

/**
 * Undo the drawer for the docked band, leaving Payload's own docked styles
 * (and the theme's base nav styles) in charge, as above 1440px.
 *
 * `revert-layer` hands a property back to `payload-default`, i.e. Payload's
 * stock docked nav; the few values that must stay the theme's are spelled out.
 * Every property the drawer rules in `styles/layout/` set must be handled here:
 * `dock.test.ts` derives that list from the stylesheet. `:root:root` outranks
 * every drawer selector, so the order of the two <style> blocks never matters.
 */
const DOCKED_RULES = `
    /* the collapse chip replaces the drawer toggler */
    :root:root .app-header__mobile-nav-toggler {
      display: none;
    }
    :root:root .pt-nav-collapse {
      display: inline-flex;
    }

    /* the nav column is back in the grid, and the card meets it with no gutter */
    :root:root .template-default {
      grid-template-columns: 0 auto;
    }
    :root:root .template-default.template-default--nav-open {
      grid-template-columns: var(--nav-width) auto;
    }
    :root:root .template-default .template-default__wrap {
      grid-column: auto;
    }
    :root:root .template-default.template-default--nav-open .template-default__wrap {
      margin-inline-start: 0;
      border-inline-start-width: var(--pt-nav-edge);
    }

    /* the aside is Payload's sticky column again, not a full-screen overlay */
    :root:root .pt-nav {
      /* Payload hides the nav until it hydrates at <=1440px; docked, it is in the first paint */
      display: block;
      position: revert-layer;
      inset: revert-layer;
      z-index: revert-layer;
      width: revert-layer;
      height: revert-layer;
      background: var(--theme-bg);
      opacity: revert-layer;
      overflow: revert-layer;
      pointer-events: revert-layer;
      transition: revert-layer;
    }
    :root:root[dir='rtl'] .pt-nav {
      border-left: revert-layer;
    }
    :root:root .pt-nav .pt-nav__backdrop {
      display: none;
    }
    :root:root .pt-nav .nav__scroll {
      position: revert-layer;
      top: revert-layer;
      bottom: revert-layer;
      inset-inline-start: revert-layer;
      z-index: revert-layer;
      width: revert-layer;
      --nav-padding-block-start: revert-layer;
      background: revert-layer;
      border-inline-end: revert-layer;
      box-shadow: revert-layer;
      pointer-events: revert-layer;
      transform: revert-layer;
      transition: revert-layer;
    }

    @media (prefers-reduced-motion: no-preference) {
      :root:root .template-default.template-default--nav-animate {
        transition: grid-template-columns var(--pt-nav-slide);
      }
    }`

/** Render the docked-band CSS — `''` when the option is off, so nothing changes by default. */
export function dockedNavToCss(dockedMinWidth: null | number): string {
  if (dockedMinWidth === null) return ''
  return `@layer payload {\n  @media ${dockedBandQuery(dockedMinWidth)} {${DOCKED_RULES}\n  }\n}`
}
