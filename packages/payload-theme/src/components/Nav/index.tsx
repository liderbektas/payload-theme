'use client'

import type { StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Hamburger,
  Link,
  useAuth,
  useConfig,
  useEntityVisibility,
  useLocale,
  useNav,
  useTranslation,
} from '@payloadcms/ui'
import { PayloadLogo } from '@payloadcms/ui/graphics/Logo'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { ResolvedThemeConfig } from '../../options'

import { CommandPalette } from '../CommandPalette'
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
      <DynamicIcon aria-hidden="true" className="pt-nav__icon" name={iconName as IconName} strokeWidth={1.9} />
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

/** Search pill under the logo — opens the ⌘K palette. The shortcut label is
 * resolved after mount so server HTML never guesses the platform. */
const NavSearch: React.FC = () => {
  const [shortcut, setShortcut] = React.useState('⌘K')

  React.useEffect(() => {
    if (/win|linux/i.test(navigator.platform)) setShortcut('Ctrl K')
  }, [])

  return (
    <button
      className="pt-nav__search"
      onClick={() => window.dispatchEvent(new CustomEvent('pt:open-palette'))}
      type="button"
    >
      <DynamicIcon aria-hidden="true" className="pt-nav__search-icon" name="search" strokeWidth={2} />
      <span className="pt-nav__search-label">Search</span>
      <kbd className="pt-nav__search-kbd" suppressHydrationWarning>
        {shortcut}
      </kbd>
    </button>
  )
}

/** Bottom-of-sidebar user block (shadcn-style footer): a full-width trigger
 * (initials avatar + name/email + up/down chevron) that opens a popup menu
 * with Account, the content-locale switcher (when localization is enabled;
 * moved here from the app header, which the stylesheet empties out) and Log
 * out. Replaces both the bare logout icon that used to sit here and the
 * header's top-right account button. */
const NavUser: React.FC = () => {
  const { user } = useAuth()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click / ESC while open.
  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Close when navigating away (e.g. after following a menu link).
  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (!user) return null

  const {
    localization,
    routes: { admin: adminRoute },
  } = config

  const email = typeof user.email === 'string' ? user.email : ''
  const rawName = (user as { name?: unknown }).name
  const name =
    typeof rawName === 'string' && rawName.trim() ? rawName.trim() : email.split('@')[0] || 'User'
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase() || '?'

  const accountHref = formatAdminURL({ adminRoute, path: config.admin?.routes?.account ?? '/account' })
  const logoutHref = formatAdminURL({ adminRoute, path: config.admin?.routes?.logout ?? '/logout' })

  // Same mechanism as Payload's own header Localizer: set the `locale` query
  // param and navigate — Payload handles the rest (incl. remembering it).
  const switchLocale = (code: string) => {
    setOpen(false)
    const params = new URLSearchParams(window.location.search)
    params.set('locale', code)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="pt-nav__user" ref={rootRef}>
      {open ? (
        <div className="pt-nav__user-menu" role="menu">
          <div className="pt-nav__user-menu-header">
            <span aria-hidden="true" className="pt-nav__user-avatar">
              {initials}
            </span>
            <span className="pt-nav__user-info">
              <span className="pt-nav__user-name">{name}</span>
              {email ? <span className="pt-nav__user-email">{email}</span> : null}
            </span>
          </div>
          <div aria-hidden="true" className="pt-nav__user-menu-sep" />
          <Link
            className="pt-nav__user-menu-item"
            href={accountHref}
            onClick={() => setOpen(false)}
            prefetch={false}
            role="menuitem"
          >
            <DynamicIcon aria-hidden="true" name="circle-user" strokeWidth={1.9} />
            Account
          </Link>
          {localization ? (
            <React.Fragment>
              <div aria-hidden="true" className="pt-nav__user-menu-sep" />
              <div className="pt-nav__user-menu-label">Locale</div>
              {localization.locales.map((localeOption) => {
                const isActive = locale?.code === localeOption.code
                return (
                  <button
                    aria-checked={isActive}
                    className="pt-nav__user-menu-item"
                    disabled={isActive}
                    key={localeOption.code}
                    onClick={() => switchLocale(localeOption.code)}
                    role="menuitemradio"
                    type="button"
                  >
                    <span aria-hidden="true" className="pt-nav__user-menu-check">
                      {isActive ? <DynamicIcon aria-hidden="true" name="check" strokeWidth={2.2} /> : null}
                    </span>
                    {getTranslation(localeOption.label, i18n)}
                  </button>
                )
              })}
            </React.Fragment>
          ) : null}
          <div aria-hidden="true" className="pt-nav__user-menu-sep" />
          <Link
            className="pt-nav__user-menu-item pt-nav__user-menu-item--logout"
            href={logoutHref}
            onClick={() => setOpen(false)}
            prefetch={false}
            role="menuitem"
          >
            <DynamicIcon aria-hidden="true" name="log-out" strokeWidth={1.9} />
            Log out
          </Link>
        </div>
      ) : null}
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="pt-nav__user-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true" className="pt-nav__user-avatar">
          {initials}
        </span>
        <span className="pt-nav__user-info">
          <span className="pt-nav__user-name">{name}</span>
          {email ? <span className="pt-nav__user-email">{email}</span> : null}
        </span>
        <DynamicIcon aria-hidden="true" className="pt-nav__user-chevron" name="chevrons-up-down" strokeWidth={2} />
      </button>
    </div>
  )
}

export const Nav: React.FC = () => {
  const pathname = usePathname()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const { isEntityVisible } = useEntityVisibility()
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav()

  // Close the mobile drawer when the command palette opens (from ⌘K OR the
  // search pill), so the palette never layers over/beside the open drawer.
  // Desktop (>1440px) keeps its always-on nav — hence the media-query gate.
  React.useEffect(() => {
    const onPaletteOpen = () => {
      if (window.matchMedia('(max-width: 1440px)').matches) setNavOpen(false)
    }
    window.addEventListener('pt:palette-open', onPaletteOpen)
    return () => window.removeEventListener('pt:palette-open', onPaletteOpen)
  }, [setNavOpen])

  const theme = config.admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined

  const {
    collections,
    globals,
    routes: { admin: adminRoute },
  } = config

  // ---- build nav groups (mirrors @payloadcms/ui's groupNavItems) ----------
  const defaultCollectionsGroup: NavGroupData = { entities: [], label: i18n.t('general:collections') }
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
    if (!isEntityVisible({ collectionSlug: slug }) || !permissions?.collections?.[slug]?.read) continue
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
      <div className="nav__scroll" ref={navRef}>
        <Link aria-label="Dashboard" className="pt-nav__logo" href={adminRoute} prefetch={false}>
          {logoIsImage ? (
            logoIsPair ? (
              <React.Fragment>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="pt-nav__logo-img pt-nav__logo-img--light" src={logo.light} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="pt-nav__logo-img pt-nav__logo-img--dark" src={logo.dark} />
              </React.Fragment>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="pt-nav__logo-img" src={logo.light} />
            )
          ) : (
            <PayloadLogo />
          )}
        </Link>
        <NavSearch />
        <nav className="nav__wrap pt-nav__wrap">
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
          <div className="nav__controls pt-nav__controls">
            <NavUser />
          </div>
        </nav>
      </div>
      {/* Mounted here (not in the ThemeProvider): the palette needs the
       * entity-visibility/permissions contexts, which only exist below
       * Payload's own providers — and the Nav renders on every authed page. */}
      <CommandPalette />
      <div className="nav__header">
        <div className="nav__header-content">
          <button
            className="nav__mobile-close"
            onClick={() => setNavOpen(false)}
            tabIndex={!navOpen ? -1 : undefined}
            type="button"
          >
            <Hamburger isActive />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Nav
