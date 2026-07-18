'use client'

import { getTranslation } from '@payloadcms/translations'
import { Link, useAuth, useConfig, useLocale, useTranslation } from '@payloadcms/ui'
import { DynamicIcon } from 'lucide-react/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

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

  const prefix = variant === 'header' ? 'pt-header-user' : 'pt-nav__user'
  const cls = (suffix: string) => `${prefix}${suffix}`

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

  const accountHref = formatAdminURL({
    adminRoute,
    path: config.admin?.routes?.account ?? '/account',
  })
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
    <div className={cls('')} ref={rootRef}>
      {open ? (
        <div className={cls('-menu')} role="menu">
          <div className={cls('-menu-header')}>
            <span aria-hidden="true" className={cls('-avatar')}>
              {initials}
            </span>
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
            <DynamicIcon aria-hidden="true" name="circle-user" strokeWidth={1.9} />
            Account
          </Link>
          {localization ? (
            <React.Fragment>
              <div aria-hidden="true" className={cls('-menu-sep')} />
              <div className={cls('-menu-label')}>Locale</div>
              {localization.locales.map((localeOption) => {
                const isActive = locale?.code === localeOption.code
                return (
                  <button
                    aria-checked={isActive}
                    className={cls('-menu-item')}
                    disabled={isActive}
                    key={localeOption.code}
                    onClick={() => switchLocale(localeOption.code)}
                    role="menuitemradio"
                    type="button"
                  >
                    <span aria-hidden="true" className={cls('-menu-check')}>
                      {isActive ? (
                        <DynamicIcon aria-hidden="true" name="check" strokeWidth={2.2} />
                      ) : null}
                    </span>
                    {getTranslation(localeOption.label, i18n)}
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
            <DynamicIcon aria-hidden="true" name="log-out" strokeWidth={1.9} />
            Log out
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
        <span aria-hidden="true" className={cls('-avatar')}>
          {initials}
        </span>
        <span className={cls('-info')}>
          <span className={cls('-name')}>{name}</span>
          {email ? <span className={cls('-email')}>{email}</span> : null}
        </span>
        <DynamicIcon
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
