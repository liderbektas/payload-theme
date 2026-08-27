'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useAuth, useConfig, useLocale, useRouteTransition } from '@payloadcms/ui'
import { useLocaleLoading } from '@payloadcms/ui/providers/Locale'
import { usePathname, useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { useThemeTranslation } from '../../translations/useThemeTranslation'
import { useThemeAvatar } from '../AvatarProvider/client'
import { Flag } from '../Flag'
import { Icon } from '../Icon'

/**
 * The shared user block: an avatar + name/email trigger opening a
 * shadcn-style dropdown with Account, the content-locale switcher (when
 * localization is enabled) and Log out.
 *
 * Two placements share this component:
 *  - `sidebar` — the full-width block pinned to the bottom of the nav
 *    (classes `pt-nav__user*`, menu opens upward)
 *  - `header`  — the compact chip at the right end of the app header
 *    (classes `pt-header-user*`, menu opens downward)
 *
 * The class PREFIX differs so each placement styles independently AND so
 * selectors like `.pt-nav__user-trigger` keep matching exactly one node.
 */
export const UserMenu: React.FC<{ variant?: 'header' | 'sidebar' }> = ({ variant = 'sidebar' }) => {
  const { user } = useAuth()
  const { config } = useConfig()
  const { node: avatarNode, src: avatarSrc } = useThemeAvatar()
  const { i18n, t } = useThemeTranslation()
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { startRouteTransition } = useRouteTransition()
  const { setLocaleIsLoading } = useLocaleLoading()

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

  const prefix = variant === 'header' ? 'pt-header-user' : 'pt-nav__user'
  const cls = (suffix: string) => `${prefix}${suffix}`

  const {
    localization,
    routes: { admin: adminRoute },
  } = config

  const email = typeof user.email === 'string' ? user.email : ''
  const rawName = (user as { name?: unknown }).name
  const name =
    typeof rawName === 'string' && rawName.trim()
      ? rawName.trim()
      : email.split('@')[0] || t('general:user')
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase() || '?'

  // Resolved server-side by the AvatarProvider: an image URL (gravatar or the
  // configured user field), a rendered `admin.avatar.Component`, or neither —
  // in which case the accent initials circle stands, as it always has.
  const avatarInner = avatarSrc ? (
    <img alt="" className={cls('-avatar-img')} src={avatarSrc} />
  ) : (
    (avatarNode ?? initials)
  )
  // The modifier drops the accent fill so artwork isn't framed by a colored
  // disc, and clips whatever the custom component renders to the circle.
  const avatar = (
    <span
      aria-hidden="true"
      className={`${cls('-avatar')}${avatarSrc || avatarNode ? ` ${cls('-avatar--image')}` : ''}`}
    >
      {avatarInner}
    </span>
  )

  const accountHref = formatAdminURL({
    adminRoute,
    path: config.admin?.routes?.account ?? '/account',
  })
  const logoutHref = formatAdminURL({ adminRoute, path: config.admin?.routes?.logout ?? '/logout' })

  // Same mechanism as Payload's own header Localizer: set the `locale` query
  // param and navigate — Payload handles the rest (incl. remembering it).
  //
  // The two wrappers are not decoration. A locale switch is a server round
  // trip, and a bare `router.push` spends all of it looking like a dead click:
  // the menu closes and NOTHING else happens — no progress bar, no spinner,
  // same URL, same field values — until the RSC payload lands. On anything
  // slower than localhost that reads as "the switcher is broken", which is
  // exactly how it was reported. `startRouteTransition` drives Payload's own
  // top progress bar; `setLocaleIsLoading` feeds `DocumentInfoProvider`'s
  // `isInitializing`, so the document view knows it is showing stale content.
  //
  // The pushed URL is relative — just the query — so it can't disagree with
  // the address bar the way a rebuilt `${pathname}?…` can under a Next
  // `basePath`, a rewrite or `trailingSlash`.
  const switchLocale = (code: string) => {
    setOpen(false)
    setLocaleIsLoading(true)
    const params = new URLSearchParams(window.location.search)
    params.set('locale', code)
    startRouteTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <div className={cls('')} ref={rootRef}>
      {open ? (
        <div className={cls('-menu')} role="menu">
          <div className={cls('-menu-header')}>
            {avatar}
            <span className={cls('-info')}>
              <span className={cls('-name')}>{name}</span>
              {email ? <span className={cls('-email')}>{email}</span> : null}
            </span>
          </div>
          <div aria-hidden="true" className={cls('-menu-sep')} />
          <Link
            className={cls('-menu-item')}
            href={accountHref}
            onClick={() => setOpen(false)}
            prefetch={false}
            role="menuitem"
          >
            <Icon aria-hidden="true" name="circle-user" strokeWidth={1.9} />
            {t('authentication:account')}
          </Link>
          {localization ? (
            <React.Fragment>
              <div aria-hidden="true" className={cls('-menu-sep')} />
              <div className={cls('-menu-label')}>{t('general:locale')}</div>
              {localization.locales.map((localeOption) => {
                const isActive = locale?.code === localeOption.code
                const label = getTranslation(localeOption.label, i18n)
                return (
                  <button
                    aria-checked={isActive}
                    className={`${cls('-menu-item')} ${cls('-menu-item--locale')}`}
                    disabled={isActive}
                    key={localeOption.code}
                    onClick={() => switchLocale(localeOption.code)}
                    role="menuitemradio"
                    type="button"
                  >
                    <span aria-hidden="true" className={cls('-menu-check')}>
                      {isActive ? <Icon aria-hidden="true" name="check" strokeWidth={2.2} /> : null}
                    </span>
                    <Flag className={cls('-menu-flag')} code={localeOption.code} />
                    <span className={cls('-menu-locale')}>
                      <span className={cls('-menu-name')}>{label}</span>
                      {/* The code, exactly as Payload's own Localizer shows it.
                       * A bare "Türkçe" reads as the PANEL language — which is
                       * a different setting, on the account page — and that
                       * mix-up is what gets reported as a broken switcher.
                       * "(tr)" says content locale without a word of prose.
                       * Dropped when the label IS the code, to avoid "tr (tr)". */}
                      {label !== localeOption.code ? (
                        <span className={cls('-menu-code')}>({localeOption.code})</span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </React.Fragment>
          ) : null}
          <div aria-hidden="true" className={cls('-menu-sep')} />
          <Link
            className={`${cls('-menu-item')} ${cls('-menu-item--logout')}`}
            href={logoutHref}
            onClick={() => setOpen(false)}
            prefetch={false}
            role="menuitem"
          >
            <Icon aria-hidden="true" name="log-out" strokeWidth={1.9} />
            {t('authentication:logOut')}
          </Link>
        </div>
      ) : null}
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={cls('-trigger')}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {avatar}
        <span className={cls('-info')}>
          <span className={cls('-name')}>{name}</span>
          {email ? <span className={cls('-email')}>{email}</span> : null}
        </span>
        <Icon
          aria-hidden="true"
          className={cls('-chevron')}
          name="chevrons-up-down"
          strokeWidth={2}
        />
      </button>
    </div>
  )
}

export default UserMenu
