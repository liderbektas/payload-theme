import type { DashboardViewServerProps } from '@payloadcms/next/views'
import type { CollectionSlug, GlobalSlug, StaticLabel } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import { Gutter } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import Link from 'next/link'
import { formatAdminURL } from 'payload/shared'
import React from 'react'

import type { ResolvedDashboardWidget, ResolvedThemeConfig } from '../../options'

import { resolveIconName } from '../navIcons'
import { CountUp } from './client'

/**
 * Themed dashboard — replaces Payload's default dashboard view.
 *
 * A SERVER component: Payload passes custom dashboard views the full server
 * props (a live `payload` instance and the current `user`), so doc counts and
 * 30-day sparkline buckets come straight from the local API —
 * access-controlled, no client fetch, no loading flash. Only the animated
 * count-up is a client component. Icons come from the plugin's `nav.icons`
 * map via `admin.custom`. Custom widgets from the `dashboard.widgets` option
 * render below all built-in content.
 */

const SPARK_DAYS = 30
/** Cap per-collection createdAt scans; sparklines sample the most recent docs. */
const SPARK_DOC_LIMIT = 400

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

/** One cell of the responsive card grid. `span: 'full'` takes the whole row. */
type DashboardCell = {
  Component: React.ComponentType
  key: string
  span?: 'full'
}

// ---- built-in cells ---------------------------------------------------------

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
      locale,
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

    // ---- sparkline (only for timestamped collections) -----------------------
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

  // ---- built-in cells ---------------------------------------------------------
  const cells: DashboardCell[] = [
    ...collectionCards.map((card) => ({ Component: () => <CollectionCard card={card} />, key: `collection-${card.slug}` })),
    ...globalCards.map((card) => ({ Component: () => <GlobalCard card={card} />, key: `global-${card.slug}` })),
  ]

  // ---- custom widgets (plugin option `dashboard.widgets`) -------------------
  // Rendered below everything built-in, resolved through the import map like
  // any Payload custom component. No widgets configured → nothing renders.
  const customWidgets: ResolvedDashboardWidget[] = theme?.dashboard?.widgets ?? []

  // Keep Payload's `gutter dashboard` classes so the layout rules in the
  // stylesheet target this view exactly like the default dashboard.
  return (
    <Gutter className="dashboard pt-dash">
      <div className="pt-dash__grid">
        {cells.map(({ Component, key, span }) => (
          <div
            className={['pt-dash__cell', span === 'full' && 'pt-dash__cell--full'].filter(Boolean).join(' ')}
            key={key}
          >
            <Component />
          </div>
        ))}
      </div>
      {customWidgets.length > 0 ? (
        <div className="pt-dash__widgets">
          {customWidgets.map((widget, index) => (
            <div className={`pt-dash__widget pt-dash__widget--${widget.width}`} key={`pt-widget-${index}`}>
              {RenderServerComponent({
                Component: widget.component,
                importMap: payload.importMap,
                serverProps: { i18n, locale, payload, user },
              })}
            </div>
          ))}
        </div>
      ) : null}
    </Gutter>
  )
}

export default Dashboard
