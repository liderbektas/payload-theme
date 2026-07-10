'use client'

import type { LucideIcon } from 'lucide-react'
import type { StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import {
  Hamburger,
  Link,
  Logout,
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

import { fallbackIcon, navIconMap } from '../navIcons'

type NavItem = {
  href: string
  Icon: LucideIcon
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
  const { href, Icon, id, label } = item

  // Same active check as Payload's DefaultNav: the link is active on its own
  // route and on any sub-route (e.g. a document edit view). `exact` restricts
  // it to the route itself (used by Dashboard, whose href prefixes everything).
  const isActive = exact
    ? pathname === href || pathname === `${href}/`
    : pathname.startsWith(href) && ['/', undefined].includes(pathname[href.length])

  const className = ['pt-nav__link', isActive && 'pt-nav__link--active']
    .filter(Boolean)
    .join(' ')

  const content = (
    <React.Fragment>
      <Icon aria-hidden="true" className="pt-nav__icon" strokeWidth={1.9} />
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

export const Nav: React.FC = () => {
  const pathname = usePathname()
  const { config } = useConfig()
  const { i18n } = useTranslation()
  const { permissions } = useAuth()
  const { isEntityVisible } = useEntityVisibility()
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav()

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
  const defaultGlobalsGroup: NavGroupData = {
    entities: [],
    label: i18n.t('general:globals'),
  }
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
    if (group === false) {
      return
    }
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
    if (!isEntityVisible({ collectionSlug: slug }) || !permissions?.collections?.[slug]?.read) {
      continue
    }
    addEntity({
      defaultGroup: defaultCollectionsGroup,
      group: collection.admin?.group,
      item: {
        href: formatAdminURL({ adminRoute, path: `/collections/${slug}` }),
        Icon: navIconMap[slug] ?? fallbackIcon,
        id: `nav-${slug}`,
        label: getTranslation(collection.labels?.plural as StaticLabel, i18n),
      },
    })
  }

  for (const global of globals) {
    const { slug } = global
    if (!isEntityVisible({ globalSlug: slug }) || !permissions?.globals?.[slug]?.read) {
      continue
    }
    addEntity({
      defaultGroup: defaultGlobalsGroup,
      group: global.admin?.group,
      item: {
        href: formatAdminURL({ adminRoute, path: `/globals/${slug}` }),
        Icon: navIconMap[slug] ?? fallbackIcon,
        id: `nav-global-${slug}`,
        label: getTranslation(global.label as StaticLabel, i18n),
      },
    })
  }

  const visibleGroups = groups.filter((group) => group.entities.length > 0)

  const dashboardItem: NavItem = {
    href: adminRoute,
    Icon: navIconMap.dashboard ?? fallbackIcon,
    id: 'nav-dashboard',
    label: i18n.t('general:dashboard'),
  }

  // ---- render --------------------------------------------------------------
  // Keeps Payload's structural `nav` classes (geometry, open/close animation,
  // scroll area) and layers `pt-nav__*` classes on top for the redesign.
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
        {/* Payload's own logo is the fallback until a custom `logo` option
         *  is wired up (Phase 4/5). It fills with --theme-elevation-1000, so
         *  it adapts to light/dark automatically. */}
        <Link aria-label="Dashboard" className="pt-nav__logo" href={adminRoute} prefetch={false}>
          <PayloadLogo />
        </Link>
        <nav className="nav__wrap pt-nav__wrap">
          <div className="pt-nav__group">
            <NavItemLink
              item={dashboardItem}
              exact
              pathname={pathname}
            />
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
            <Logout />
          </div>
        </nav>
      </div>
      <div className="nav__header">
        <div className="nav__header-content">
          <button
            className="nav__mobile-close"
            onClick={() => {
              setNavOpen(false)
            }}
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
