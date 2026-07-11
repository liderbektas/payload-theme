'use client'

import type { StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { useAuth, useConfig, useEntityVisibility, useTheme, useTranslation } from '@payloadcms/ui'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import React from 'react'
import { createPortal } from 'react-dom'

import type { ResolvedThemeConfig } from '../../options'

import { resolveIconName } from '../navIcons'

/**
 * ⌘K / Ctrl+K command palette. Mounted once by the ThemeProvider (admin pages
 * only — it renders nothing until a user is logged in). Zero dependencies:
 * the list, keyboard loop and portal are hand-rolled so the package stays
 * lean.
 *
 * Sources:
 * - static: navigate to any collection/global, "create new" for collections
 *   the user may create in, toggle color scheme, log out
 * - async: document search across collections with a text `useAsTitle`,
 *   via Payload's REST API (cookies carry auth; access control applies)
 */

type PaletteItem = {
  group: string
  hint?: string
  iconName: string
  id: string
  label: string
  perform: () => void
}

type SearchableCollection = {
  apiPath: string
  editPathPrefix: `/${string}`
  iconName: string
  label: string
  slug: string
  titleField: string
}

const SEARCH_DEBOUNCE_MS = 220
const MAX_SEARCHED_COLLECTIONS = 8
const RESULTS_PER_COLLECTION = 3

const matches = (query: string, label: string): boolean =>
  label.toLocaleLowerCase().includes(query.toLocaleLowerCase())

export const CommandPalette: React.FC = () => {
  const { permissions, user } = useAuth()
  const { isEntityVisible } = useEntityVisibility()
  const { config } = useConfig()
  const { setTheme, theme: colorScheme } = useTheme()
  const { i18n } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [docResults, setDocResults] = React.useState<PaletteItem[]>([])
  const [searching, setSearching] = React.useState(false)
  const [isMac, setIsMac] = React.useState(true)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  const themeConfig = config.admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined
  const adminRoute = config.routes.admin
  const apiRoute = config.routes.api
  const serverURL = config.serverURL ?? ''

  React.useEffect(() => {
    setIsMac(!/win|linux/i.test(typeof navigator === 'undefined' ? '' : navigator.platform))
  }, [])

  const close = React.useCallback(() => {
    setOpen(false)
    setQuery('')
    setDocResults([])
    setActiveIndex(0)
  }, [])

  const go = React.useCallback(
    (href: string) => {
      close()
      router.push(href)
    },
    [close, router],
  )

  // ---- static items (rebuilt per render — config and permissions are stable) --
  const { searchableCollections, staticItems } = React.useMemo(() => {
    const items: PaletteItem[] = []
    const searchable: SearchableCollection[] = []

    // Unauthenticated views (login, forgot-password) render the provider tree
    // without the entity-visibility context — the palette is inert there.
    if (!user || typeof isEntityVisible !== 'function') {
      return { searchableCollections: searchable, staticItems: items }
    }

    items.push({
      group: 'Navigate',
      iconName: themeConfig?.nav?.icons?.dashboard ?? 'layout-dashboard',
      id: 'nav-dashboard',
      label: i18n.t('general:dashboard'),
      perform: () => go(adminRoute),
    })

    for (const collection of config.collections ?? []) {
      const slug = collection.slug
      if (!isEntityVisible({ collectionSlug: slug }) || !permissions?.collections?.[slug]?.read) continue

      const label = getTranslation(collection.labels?.plural as StaticLabel, i18n)
      const iconName = resolveIconName(themeConfig, slug)
      const href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })

      items.push({
        group: 'Navigate',
        hint: 'Collection',
        iconName,
        id: `nav-${slug}`,
        label,
        perform: () => go(href),
      })

      const titleField = collection.admin?.useAsTitle
      if (typeof titleField === 'string' && titleField !== 'id') {
        searchable.push({
          apiPath: `${serverURL}${apiRoute}/${slug}`,
          editPathPrefix: `/collections/${slug}`,
          iconName,
          label,
          slug,
          titleField,
        })
      }
    }

    for (const global of config.globals ?? []) {
      const slug = global.slug
      if (!isEntityVisible({ globalSlug: slug }) || !permissions?.globals?.[slug]?.read) continue
      items.push({
        group: 'Navigate',
        hint: 'Global',
        iconName: resolveIconName(themeConfig, slug),
        id: `nav-global-${slug}`,
        label: getTranslation(global.label as StaticLabel, i18n),
        perform: () => go(formatAdminURL({ adminRoute, path: `/globals/${slug}` })),
      })
    }

    items.push({
      group: 'Actions',
      hint: 'Appearance',
      iconName: colorScheme === 'dark' ? 'sun' : 'moon',
      id: 'action-theme',
      label: colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      perform: () => {
        setTheme(colorScheme === 'dark' ? 'light' : 'dark')
        close()
      },
    })
    items.push({
      group: 'Actions',
      hint: 'Session',
      iconName: 'log-out',
      id: 'action-logout',
      label: i18n.t('authentication:logOut'),
      perform: () =>
        go(formatAdminURL({ adminRoute, path: config.admin?.routes?.logout ?? '/logout' })),
    })

    return { searchableCollections: searchable, staticItems: items }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, themeConfig, i18n, adminRoute, apiRoute, serverURL, colorScheme, go, setTheme, close, permissions, isEntityVisible, user])

  // ---- open/close wiring ------------------------------------------------------
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    const onOpenEvent = () => setOpen(true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pt:open-palette', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pt:open-palette', onOpenEvent)
    }
  }, [])

  // Close when navigating (e.g. browser back) and lock body scroll while open.
  React.useEffect(() => {
    if (!open) return
    // Let the Nav close the mobile drawer before we layer the panel on top.
    window.dispatchEvent(new CustomEvent('pt:palette-open'))
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  React.useEffect(() => {
    close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // ---- async document search ---------------------------------------------------
  React.useEffect(() => {
    if (!open) return
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setDocResults([])
      setSearching(false)
      return
    }

    const controller = new AbortController()
    setSearching(true)
    const timer = window.setTimeout(async () => {
      try {
        const targets = searchableCollections.slice(0, MAX_SEARCHED_COLLECTIONS)
        const responses = await Promise.all(
          targets.map(async (target) => {
            const params = new URLSearchParams({
              depth: '0',
              limit: String(RESULTS_PER_COLLECTION),
              [`where[${target.titleField}][like]`]: trimmed,
            })
            const response = await fetch(`${target.apiPath}?${params.toString()}`, {
              credentials: 'include',
              signal: controller.signal,
            })
            if (!response.ok) return []
            const data = (await response.json()) as { docs?: Array<Record<string, unknown>> }
            return (data.docs ?? []).map((doc): PaletteItem => {
              const raw = doc[target.titleField]
              const title = typeof raw === 'string' && raw.trim() ? raw : `#${String(doc.id)}`
              return {
                group: 'Documents',
                hint: target.label,
                iconName: target.iconName,
                id: `doc-${target.slug}-${String(doc.id)}`,
                label: title,
                perform: () =>
                  go(formatAdminURL({ adminRoute, path: `${target.editPathPrefix}/${String(doc.id)}` })),
              }
            })
          }),
        )
        setDocResults(responses.flat())
      } catch {
        // aborted or offline — stale results are simply kept off the list
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [open, query, searchableCollections, adminRoute, go])

  // ---- filtering + grouping -----------------------------------------------------
  const trimmedQuery = query.trim()
  const visibleItems = React.useMemo(() => {
    const filteredStatic = trimmedQuery
      ? staticItems.filter((item) => matches(trimmedQuery, item.label))
      : staticItems
    return [...docResults, ...filteredStatic]
  }, [staticItems, docResults, trimmedQuery])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [trimmedQuery, docResults.length])

  // Keep the active row in view while arrowing through the list.
  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-pt-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (!user) return null
  if (!open) return null
  if (typeof document === 'undefined') return null

  const groups: Array<{ items: Array<{ index: number; item: PaletteItem }>; label: string }> = []
  visibleItems.forEach((item, index) => {
    const last = groups[groups.length - 1]
    if (last && last.label === item.group) last.items.push({ index, item })
    else groups.push({ items: [{ index, item }], label: item.group })
  })

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(current + 1, visibleItems.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      visibleItems[activeIndex]?.perform()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  return createPortal(
    <div className="pt-palette" role="presentation">
      <div aria-hidden="true" className="pt-palette__backdrop" onClick={close} />
      <div aria-label="Command palette" aria-modal="true" className="pt-palette__panel" role="dialog">
        <div className="pt-palette__search">
          <DynamicIcon aria-hidden="true" className="pt-palette__search-icon" name="search" strokeWidth={2} />
          <input
            aria-label="Search"
            className="pt-palette__input"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search or jump to…"
            ref={inputRef}
            type="text"
            value={query}
          />
          <button className="pt-palette__esc" onClick={close} type="button">
            esc
          </button>
        </div>
        <div className="pt-palette__list" ref={listRef}>
          {searching ? <div className="pt-palette__status">Searching documents…</div> : null}
          {!searching && visibleItems.length === 0 ? (
            <div className="pt-palette__status">No results for “{trimmedQuery}”</div>
          ) : null}
          {groups.map((group) => (
            <div className="pt-palette__group" key={group.label}>
              <div className="pt-palette__group-label">{group.label}</div>
              {group.items.map(({ index, item }) => (
                <button
                  className={[
                    'pt-palette__item',
                    index === activeIndex && 'pt-palette__item--active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-pt-index={index}
                  key={item.id}
                  onClick={() => item.perform()}
                  onMouseMove={() => setActiveIndex(index)}
                  type="button"
                >
                  <span aria-hidden="true" className="pt-palette__item-icon">
                    <DynamicIcon aria-hidden="true" name={item.iconName as IconName} strokeWidth={1.9} />
                  </span>
                  <span className="pt-palette__item-label">{item.label}</span>
                  {item.hint ? <span className="pt-palette__item-hint">{item.hint}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="pt-palette__footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
            <kbd>K</kbd> toggle
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CommandPalette
