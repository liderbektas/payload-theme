import type { DashboardViewServerProps } from '@payloadcms/next/views'
import type { CollectionSlug, GlobalSlug, StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { Gutter } from '@payloadcms/ui'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import Link from 'next/link'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { ResolvedThemeConfig } from '../../options'

import { resolveIconName } from '../navIcons'

/**
 * Themed dashboard — replaces Payload's default dashboard view.
 *
 * A SERVER component: Payload passes custom dashboard views the full server
 * props (a live `payload` instance and the current `user`), so doc counts come
 * straight from `payload.count()` — access-controlled, no client fetch, no
 * loading flash. Icons come from the plugin's `nav.icons` map via `admin.custom`.
 */

type CollectionCardData = {
  count: null | number
  createHref: null | string
  href: string
  iconName: string
  label: string
  slug: string
}

type GlobalCardData = {
  href: string
  iconName: string
  label: string
  slug: string
}

/** One cell of the responsive widget grid. `span: 'full'` takes the whole row. */
type DashboardWidget = {
  Component: React.ComponentType
  key: string
  span?: 'full'
}

// ---- widgets ---------------------------------------------------------------

const WelcomeWidget: React.FC<{ email?: string }> = ({ email }) => (
  <section className="pt-dash__welcome">
    <h1 className="pt-dash__welcome-title">Welcome back</h1>
    {email ? <p className="pt-dash__welcome-user">{email}</p> : null}
    <p className="pt-dash__welcome-hint">Here is an overview of your content.</p>
  </section>
)

const CollectionCard: React.FC<{ card: CollectionCardData }> = ({ card }) => {
  const { count, createHref, href, iconName, label } = card

  return (
    <article className="pt-dash__card">
      <div className="pt-dash__card-head">
        <span aria-hidden="true" className="pt-dash__card-icon">
          <DynamicIcon aria-hidden="true" name={iconName as IconName} strokeWidth={1.9} />
        </span>
        <span className="pt-dash__card-label">{label}</span>
      </div>
      <div className="pt-dash__card-body">
        <span className="pt-dash__card-count">{count === null ? '—' : count.toLocaleString('en-US')}</span>
        <span className="pt-dash__card-caption">{count === 1 ? 'document' : 'documents'}</span>
      </div>
      {/* Stretched link makes the whole card clickable without nesting the '+'. */}
      <Link aria-label={label} className="pt-dash__card-link" href={href} prefetch={false} />
      {createHref ? (
        <Link aria-label={`Create new ${label}`} className="pt-dash__card-create" href={createHref} prefetch={false}>
          <DynamicIcon aria-hidden="true" name="plus" strokeWidth={2} />
        </Link>
      ) : null}
    </article>
  )
}

const GlobalCard: React.FC<{ card: GlobalCardData }> = ({ card }) => {
  const { href, iconName, label } = card

  return (
    <article className="pt-dash__card pt-dash__card--global">
      <div className="pt-dash__card-head">
        <span aria-hidden="true" className="pt-dash__card-icon">
          <DynamicIcon aria-hidden="true" name={iconName as IconName} strokeWidth={1.9} />
        </span>
        <span className="pt-dash__card-label">Global</span>
      </div>
      <div className="pt-dash__card-body">
        <span className="pt-dash__card-title">{label}</span>
        <span className="pt-dash__card-caption">Manage configuration</span>
      </div>
      <Link aria-label={label} className="pt-dash__card-link" href={href} prefetch={false} />
    </article>
  )
}

// ---- view ------------------------------------------------------------------

export async function Dashboard(props: DashboardViewServerProps) {
  const {
    initPageResult: {
      permissions,
      req: { i18n, payload, user },
      visibleEntities,
    },
  } = props

  const {
    config: {
      admin,
      collections,
      globals,
      routes: { admin: adminRoute },
    },
  } = payload

  const theme = admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined

  // ---- collection cards (same visibility + read filtering as the Nav) ------
  const collectionCards: CollectionCardData[] = []

  for (const collection of collections) {
    const slug = collection.slug as CollectionSlug
    if (!visibleEntities.collections.includes(slug) || !permissions?.collections?.[slug]?.read) continue

    let count: null | number = null
    try {
      const result = await payload.count({ collection: slug, overrideAccess: false, user })
      count = result.totalDocs
    } catch {
      // keep the em-dash placeholder — a failed count must never break the page
    }

    collectionCards.push({
      count,
      createHref: permissions?.collections?.[slug]?.create
        ? formatAdminURL({ adminRoute, path: `/collections/${slug}/create` })
        : null,
      href: formatAdminURL({ adminRoute, path: `/collections/${slug}` }),
      iconName: resolveIconName(theme, slug),
      label: getTranslation(collection.labels?.plural as StaticLabel, i18n),
      slug,
    })
  }

  // ---- global cards ---------------------------------------------------------
  const globalCards: GlobalCardData[] = []

  for (const global of globals) {
    const slug = global.slug as GlobalSlug
    if (!visibleEntities.globals.includes(slug) || !permissions?.globals?.[slug]?.read) continue

    globalCards.push({
      href: formatAdminURL({ adminRoute, path: `/globals/${slug}` }),
      iconName: resolveIconName(theme, slug),
      label: getTranslation(global.label as StaticLabel, i18n),
      slug,
    })
  }

  // ---- widget slots ---------------------------------------------------------
  const widgets: DashboardWidget[] = [
    { Component: () => <WelcomeWidget email={user?.email ?? undefined} />, key: 'welcome', span: 'full' },
    ...collectionCards.map((card) => ({ Component: () => <CollectionCard card={card} />, key: `collection-${card.slug}` })),
    ...globalCards.map((card) => ({ Component: () => <GlobalCard card={card} />, key: `global-${card.slug}` })),
  ]

  // Keep Payload's `gutter dashboard` classes so the layout rules in the
  // stylesheet target this view exactly like the default dashboard.
  return (
    <Gutter className="dashboard pt-dash">
      <div className="pt-dash__grid">
        {widgets.map(({ Component, key, span }) => (
          <div
            className={['pt-dash__cell', span === 'full' && 'pt-dash__cell--full'].filter(Boolean).join(' ')}
            key={key}
          >
            <Component />
          </div>
        ))}
      </div>
    </Gutter>
  )
}

export default Dashboard
