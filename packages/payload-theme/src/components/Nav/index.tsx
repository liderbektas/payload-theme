'use client'

import type { StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Link,
  useAuth,
  useConfig,
  useEntityVisibility,
  useNav,
  useTranslation,
} from '@payloadcms/ui'
import { PayloadLogo } from '@payloadcms/ui/graphics/Logo'
import { usePathname } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { ResolvedThemeConfig } from '../../options'

import { useThemeTranslation } from '../../translations/useThemeTranslation'
import { CommandPalette } from '../CommandPalette'
import { DocOutline } from '../DocOutline'
import { Icon, type IconName } from '../Icon'
import { ShortcutsModal } from '../ShortcutsModal'
import { UserMenu } from '../UserMenu'
import { resolveIconName } from '../navIcons'

type NavItem = {
  href: string
  iconName: string
  id: string
  label: string
}

type NavGroupData = {
  entities: NavItem[]
  label: string
}

const NavItemLink: React.FC<{ exact?: boolean; item: NavItem; pathname: string }> = ({
  exact,
  item,
  pathname,
}) => {
  const { href, iconName, id, label } = item

  // Same active check as Payload's DefaultNav: the link is active on its own
  // route and on any sub-route (e.g. a document edit view). `exact` restricts
  // it to the route itself (used by Dashboard, whose href prefixes everything).
  const isActive = exact
    ? pathname === href || pathname === `${href}/`
    : pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

  const className = ['pt-nav__link', isActive && 'pt-nav__link--active'].filter(Boolean).join(' ')

  const content = (
    <React.Fragment>
      <Icon
        aria-hidden="true"
        className="pt-nav__icon"
        name={iconName as IconName}
        strokeWidth={1.9}
      />
      <span className="pt-nav__label">{label}</span>
    </React.Fragment>
  )

  // Exactly like the default nav: the link for the page you are already on is
  // rendered as a plain div so it is not a self-navigating anchor.
  if (pathname === href) {
    return (
      <div aria-current="page" className={className} id={id}>
        {content}
      </div>
    )
  }

  return (
    <Link className={className} href={href} id={id} prefetch={false}>
      {content}
    </Link>
  )
}

/** True for a Payload import-map component path (e.g. `/components/X#X`). */
const isComponentPath = (value: string): boolean => value.includes('#')

/** Last resolved shortcut label. Module scope, so the Nav's remount on every
 * navigation starts from the platform's label instead of replaying the ⌘K →
 * Ctrl K swap (see the icon cache in ../Icon for the same reason). */
let shortcutLabel = '⌘K'

/** Search pill under the logo — opens the ⌘K palette. The shortcut label is
 * resolved after mount so server HTML never guesses the platform. */
const NavSearch: React.FC = () => {
  const { t } = useThemeTranslation()
  const [shortcut, setShortcut] = React.useState(shortcutLabel)

  React.useEffect(() => {
    shortcutLabel = /win|linux/i.test(navigator.platform) ? 'Ctrl K' : '⌘K'
    setShortcut(shortcutLabel)
  }, [])

  return (
    <button
      className="pt-nav__search"
      onClick={() => window.dispatchEvent(new CustomEvent('pt:open-palette'))}
      type="button"
    >
      <Icon
        aria-hidden="true"
        className="pt-nav__search-icon"
        name="search"
        strokeWidth={2}
      />
      <span className="pt-nav__search-label">{t('payloadTheme:search')}</span>
      <kbd className="pt-nav__search-kbd" suppressHydrationWarning>
        {shortcut}
      </kbd>
    </button>
  )
}

/** How far the entity list was scrolled, kept at module scope for the same
 * reason as the icon cache: Payload renders the Nav inside `DefaultTemplate`,
 * which belongs to the page rather than the layout, so every navigation
 * remounts the sidebar and throws its scrolled `<nav>` node away. */
let navScrollTop = 0

/** SSR-safe layout effect: restoring the offset must happen before the browser
 * paints, but the Nav is server-rendered too and `useLayoutEffect` warns there. */
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

/**
 * Keeps the menu's scroll offset across navigations: remembers it while the
 * user scrolls and puts it back on the next mount, so clicking a collection
 * you had to scroll down to no longer snaps the sidebar back to the top.
 */
const useNavScrollMemory = () => {
  const ref = React.useRef<HTMLElement | null>(null)

  useIsomorphicLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    // Clamped by the browser, so a shorter menu (fewer permitted entities)
    // simply lands at its own bottom instead of an impossible offset.
    if (navScrollTop > 0) element.scrollTop = navScrollTop

    const onScroll = () => {
      navScrollTop = element.scrollTop
    }
    element.addEventListener('scroll', onScroll, { passive: true })
    return () => element.removeEventListener('scroll', onScroll)
  }, [])

  return ref
}

export const Nav: React.FC = () => {
  const pathname = usePathname()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const { isEntityVisible } = useEntityVisibility()
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav()
  const menuRef = useNavScrollMemory()

  // Close the mobile drawer when the command palette opens (from ⌘K OR the
  // search pill), so the palette never layers over/beside the open drawer.
  // Desktop (>1440px) keeps its always-on nav — hence the media-query gate.
  React.useEffect(() => {
    const onPaletteOpen = () => {
      if (window.matchMedia('(max-width: 1440px)').matches) setNavOpen(false)
    }
    // Esc also closes the mobile drawer (it has no X — backdrop tap or Esc).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && window.matchMedia('(max-width: 1440px)').matches)
        setNavOpen(false)
    }
    window.addEventListener('pt:palette-open', onPaletteOpen)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pt:palette-open', onPaletteOpen)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [setNavOpen])

  const theme = config.admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined

  const {
    collections,
    globals,
    routes: { admin: adminRoute },
  } = config

  // ---- build nav groups (mirrors @payloadcms/ui's groupNavItems) ----------
  const defaultCollectionsGroup: NavGroupData = {
    entities: [],
    label: i18n.t('general:collections'),
  }
  const defaultGlobalsGroup: NavGroupData = { entities: [], label: i18n.t('general:globals') }
  const groups: NavGroupData[] = [defaultCollectionsGroup, defaultGlobalsGroup]

  const addEntity = ({
    defaultGroup,
    group,
    item,
  }: {
    defaultGroup: NavGroupData
    group: false | Record<string, string> | string | undefined
    item: NavItem
  }) => {
    if (group === false) return
    if (group) {
      const translated = getTranslation(group, i18n)
      let matched = groups.find((existing) => existing.label === translated)
      if (!matched) {
        matched = { entities: [], label: translated }
        groups.push(matched)
      }
      matched.entities.push(item)
    } else {
      defaultGroup.entities.push(item)
    }
  }

  for (const collection of collections) {
    const { slug } = collection
    if (!isEntityVisible({ collectionSlug: slug }) || !permissions?.collections?.[slug]?.read)
      continue
    addEntity({
      defaultGroup: defaultCollectionsGroup,
      group: collection.admin?.group,
      item: {
        href: formatAdminURL({ adminRoute, path: `/collections/${slug}` }),
        iconName: resolveIconName(theme, slug),
        id: `nav-${slug}`,
        label: getTranslation(collection.labels?.plural as StaticLabel, i18n),
      },
    })
  }

  for (const global of globals) {
    const { slug } = global
    if (!isEntityVisible({ globalSlug: slug }) || !permissions?.globals?.[slug]?.read) continue
    addEntity({
      defaultGroup: defaultGlobalsGroup,
      group: global.admin?.group,
      item: {
        href: formatAdminURL({ adminRoute, path: `/globals/${slug}` }),
        iconName: resolveIconName(theme, slug),
        id: `nav-global-${slug}`,
        label: getTranslation(global.label as StaticLabel, i18n),
      },
    })
  }

  const visibleGroups = groups.filter((group) => group.entities.length > 0)

  const dashboardItem: NavItem = {
    href: adminRoute,
    iconName: theme?.nav?.icons?.dashboard ?? 'layout-dashboard',
    id: 'nav-dashboard',
    label: i18n.t('general:dashboard'),
  }

  // A plain image URL renders as the logo; a component-path or missing value
  // falls back to Payload's own logo (adapts to light/dark automatically).
  // When light/dark URLs differ, both render and CSS shows the right one.
  const logo = theme?.logo
  const logoIsImage = logo && !isComponentPath(logo.light)
  const logoIsPair = logoIsImage && logo.dark !== logo.light

  const asideClasses = [
    'nav',
    'pt-nav',
    navOpen && 'nav--nav-open',
    shouldAnimate && 'nav--nav-animate',
    hydrated && 'nav--nav-hydrated',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={asideClasses} inert={!navOpen}>
      {/* Mobile-only scrim behind the drawer: blurred, tap to close. The
       * drawer has no X — this IS the close affordance (plus navigation).
       * Desktop hides it entirely via the stylesheet. */}
      <div
        aria-hidden="true"
        className="pt-nav__backdrop"
        onClick={() => setNavOpen(false)}
      />
      <div className="nav__scroll" ref={navRef}>
        <Link
          aria-label={i18n.t('general:dashboard')}
          className="pt-nav__logo"
          href={adminRoute}
          prefetch={false}
        >
          {logoIsImage ? (
            logoIsPair ? (
              <React.Fragment>
                {}
                <img alt="" className="pt-nav__logo-img pt-nav__logo-img--light" src={logo.light} />
                {}
                <img alt="" className="pt-nav__logo-img pt-nav__logo-img--dark" src={logo.dark} />
              </React.Fragment>
            ) : (
              <img alt="" className="pt-nav__logo-img" src={logo.light} />
            )
          ) : (
            <PayloadLogo />
          )}
        </Link>
        <NavSearch />
        {/* Only this middle block scrolls — the logo/search above and the
         * user block below stay pinned at any content height. */}
        <nav className="nav__wrap pt-nav__wrap" ref={menuRef}>
          <div className="pt-nav__group">
            <NavItemLink item={dashboardItem} exact pathname={pathname} />
          </div>
          {visibleGroups.map((group) => (
            <div className="pt-nav__group" key={group.label}>
              <div className="pt-nav__group-label">{group.label}</div>
              {group.entities.map((item) => (
                <NavItemLink item={item} key={item.id} pathname={pathname} />
              ))}
            </div>
          ))}
        </nav>
        <div className="nav__controls pt-nav__controls">
          <UserMenu variant="sidebar" />
        </div>
      </div>
      {/* Mounted here (not in the ThemeProvider): the palette needs the
       * entity-visibility/permissions contexts, which only exist below
       * Payload's own providers — and the Nav renders on every authed page. */}
      <CommandPalette />
      <ShortcutsModal />
      <DocOutline />
    </aside>
  )
}

export default Nav
