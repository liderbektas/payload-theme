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
import { CountUp, Greeting, TimeAgo, TodayDate } from './client'

/**
 * Themed dashboard — replaces Payload's default dashboard view.
 *
 * A SERVER component: Payload passes custom dashboard views the full server
 * props (a live `payload` instance and the current `user`), so doc counts,
 * 30-day sparkline buckets and the recent-activity feed all come straight from
 * the local API — access-controlled, no client fetch, no loading flash. Only
 * the viewer-clock leaves (greeting, count-up, relative times) are client
 * components. Icons come from the plugin's `nav.icons` map via `admin.custom`.
 */

const SPARK_DAYS = 30
/** Cap per-collection createdAt scans; sparklines sample the most recent docs. */
const SPARK_DOC_LIMIT = 400
const RECENT_LIMIT = 8

type CollectionCardData = {
  count: null | number
  createHref: null | string
  href: string
  iconName: string
  label: string
  slug: string
  /** Docs created per day over the last {@link SPARK_DAYS} days (oldest first). */
  spark: null | number[]
}

type GlobalCardData = {
  href: string
  iconName: string
  label: string
  slug: string
}

type RecentDocData = {
  collectionLabel: string
  href: string
  iconName: string
  id: number | string
  title: string
  updatedAt: string
}

/** One cell of the responsive widget grid. `span: 'full'` takes the whole row. */
type DashboardWidget = {
  Component: React.ComponentType
  key: string
  span?: 'full'
}

// ---- widgets ---------------------------------------------------------------

const WelcomeWidget: React.FC<{ email?: string; name?: string }> = ({ email, name }) => (
  <section className="pt-dash__welcome">
    <div className="pt-dash__welcome-row">
      <h1 className="pt-dash__welcome-title">
        <Greeting name={name} />
      </h1>
      <span className="pt-dash__welcome-date">
        <TodayDate />
      </span>
    </div>
    <p className="pt-dash__welcome-hint">
      Here is an overview of your content.
      {email ? <span className="pt-dash__welcome-user"> Signed in as {email}.</span> : null}
    </p>
  </section>
)

/** Tiny area sparkline. Pure server-rendered SVG — no client JS, recolors via
 * currentColor so it follows the accent token. */
const Sparkline: React.FC<{ id: string; points: number[] }> = ({ id, points }) => {
  const W = 100
  const H = 28
  const max = Math.max(...points, 1)
  const step = W / Math.max(points.length - 1, 1)
  const coords = points.map((value, i) => ({
    x: i * step,
    y: H - 2 - (value / max) * (H - 6),
  }))
  const line = coords.map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  const area = `${line} L${W} ${H} L0 ${H} Z`
  const gradientId = `pt-spark-${id}`

  return (
    <svg aria-hidden="true" className="pt-dash__spark" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} stroke="none" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const CollectionCard: React.FC<{ card: CollectionCardData }> = ({ card }) => {
  const { count, createHref, href, iconName, label, slug, spark } = card

  return (
    <article className="pt-dash__card">
      <div className="pt-dash__card-head">
        <span aria-hidden="true" className="pt-dash__card-icon">
          <DynamicIcon aria-hidden="true" name={iconName as IconName} strokeWidth={1.9} />
        </span>
        <span className="pt-dash__card-label">{label}</span>
      </div>
      <div className="pt-dash__card-body">
        <span className="pt-dash__card-count">{count === null ? '—' : <CountUp value={count} />}</span>
        <span className="pt-dash__card-caption">
          {count === 1 ? 'document' : 'documents'}
          {spark ? ' · last 30 days' : ''}
        </span>
      </div>
      {spark ? <Sparkline id={slug} points={spark} /> : null}
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

const RecentActivityWidget: React.FC<{ docs: RecentDocData[] }> = ({ docs }) => (
  <section className="pt-dash__recent">
    <div className="pt-dash__recent-head">
      <h2 className="pt-dash__recent-title">Recent activity</h2>
      <span className="pt-dash__recent-caption">Latest edits across your collections</span>
    </div>
    {docs.length === 0 ? (
      <p className="pt-dash__recent-empty">Nothing here yet — your latest edits will show up in this feed.</p>
    ) : (
      <ul className="pt-dash__recent-list">
        {docs.map((doc) => (
          <li className="pt-dash__recent-item" key={`${doc.collectionLabel}-${doc.id}`}>
            <Link className="pt-dash__recent-link" href={doc.href} prefetch={false}>
              <span aria-hidden="true" className="pt-dash__recent-icon">
                <DynamicIcon aria-hidden="true" name={doc.iconName as IconName} strokeWidth={1.9} />
              </span>
              <span className="pt-dash__recent-text">
                <span className="pt-dash__recent-doc">{doc.title}</span>
                <span className="pt-dash__recent-meta">{doc.collectionLabel}</span>
              </span>
              <span className="pt-dash__recent-time">
                <TimeAgo iso={doc.updatedAt} />
              </span>
              <DynamicIcon aria-hidden="true" className="pt-dash__recent-chevron" name="chevron-right" strokeWidth={2} />
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
)

// ---- data helpers ----------------------------------------------------------

/** Midnight (server time) SPARK_DAYS-1 days ago — the left edge of the sparkline. */
function sparkWindowStart(): Date {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (SPARK_DAYS - 1))
  return start
}

/** Bucket createdAt timestamps into one count per day, oldest day first. */
function bucketByDay(timestamps: string[], since: Date): number[] {
  const buckets = new Array<number>(SPARK_DAYS).fill(0)
  const dayMs = 24 * 60 * 60 * 1000
  for (const iso of timestamps) {
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) continue
    const index = Math.floor((t - since.getTime()) / dayMs)
    if (index >= 0 && index < SPARK_DAYS) buckets[index] += 1
  }
  return buckets
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
  const since = sparkWindowStart()

  // ---- collection cards (same visibility + read filtering as the Nav) ------
  const collectionCards: CollectionCardData[] = []
  const recentDocs: RecentDocData[] = []

  for (const collection of collections) {
    const slug = collection.slug as CollectionSlug
    if (!visibleEntities.collections.includes(slug) || !permissions?.collections?.[slug]?.read) continue

    const label = getTranslation(collection.labels?.plural as StaticLabel, i18n)
    const iconName = resolveIconName(theme, slug)
    const href = formatAdminURL({ adminRoute, path: `/collections/${slug}` })

    let count: null | number = null
    try {
      const result = await payload.count({ collection: slug, overrideAccess: false, user })
      count = result.totalDocs
    } catch {
      // keep the em-dash placeholder — a failed count must never break the page
    }

    // ---- sparkline + recent feed (only for timestamped collections) --------
    let spark: null | number[] = null
    if (collection.timestamps !== false) {
      try {
        const created = await payload.find({
          collection: slug,
          depth: 0,
          limit: SPARK_DOC_LIMIT,
          overrideAccess: false,
          select: { createdAt: true },
          sort: '-createdAt',
          user,
          where: { createdAt: { greater_than_equal: since.toISOString() } },
        })
        const buckets = bucketByDay(
          created.docs.map((doc) => String((doc as { createdAt?: unknown }).createdAt ?? '')),
          since,
        )
        if (buckets.some((value) => value > 0)) spark = buckets
      } catch {
        // no sparkline is fine — the card still renders
      }

      try {
        const titleField =
          typeof collection.admin?.useAsTitle === 'string' && collection.admin.useAsTitle !== 'id'
            ? collection.admin.useAsTitle
            : null
        const recent = await payload.find({
          collection: slug,
          depth: 0,
          limit: 4,
          overrideAccess: false,
          select: { updatedAt: true, ...(titleField ? { [titleField]: true } : {}) },
          sort: '-updatedAt',
          user,
        })
        for (const doc of recent.docs) {
          const raw = titleField ? (doc as Record<string, unknown>)[titleField] : null
          const title = typeof raw === 'string' && raw.trim() ? raw : `${label} #${doc.id}`
          recentDocs.push({
            collectionLabel: label,
            href: formatAdminURL({ adminRoute, path: `/collections/${slug}/${doc.id}` }),
            iconName,
            id: doc.id as number | string,
            title,
            updatedAt: String((doc as { updatedAt?: unknown }).updatedAt ?? ''),
          })
        }
      } catch {
        // a collection that fails to list simply stays out of the feed
      }
    }

    collectionCards.push({
      count,
      createHref: permissions?.collections?.[slug]?.create
        ? formatAdminURL({ adminRoute, path: `/collections/${slug}/create` })
        : null,
      href,
      iconName,
      label,
      slug,
      spark,
    })
  }

  recentDocs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const recent = recentDocs.slice(0, RECENT_LIMIT)

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
  const rawName = (user as { name?: unknown } | null)?.name
  const firstName = typeof rawName === 'string' && rawName.trim() ? rawName.trim().split(/\s+/)[0] : undefined

  const widgets: DashboardWidget[] = [
    {
      Component: () => <WelcomeWidget email={user?.email ?? undefined} name={firstName} />,
      key: 'welcome',
      span: 'full',
    },
    ...collectionCards.map((card) => ({ Component: () => <CollectionCard card={card} />, key: `collection-${card.slug}` })),
    ...globalCards.map((card) => ({ Component: () => <GlobalCard card={card} />, key: `global-${card.slug}` })),
    { Component: () => <RecentActivityWidget docs={recent} />, key: 'recent', span: 'full' },
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
