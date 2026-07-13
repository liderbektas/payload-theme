import type { DashboardWidgetServerProps } from 'payload-theme'

import React from 'react'

/**
 * Example SERVER widget for the playground: receives the live `payload`
 * instance and the current `user` as props, so it can query anything the
 * local API exposes. Reuses the theme's card classes to blend into the
 * dashboard grid.
 */
export const ContentSummaryWidget: React.FC<DashboardWidgetServerProps> = async ({
  payload,
  user,
}) => {
  const drafts = await payload
    .count({
      collection: 'posts',
      overrideAccess: false,
      user,
      where: { _status: { equals: 'draft' } },
    })
    .then((result) => result.totalDocs)
    .catch(() => null)

  return (
    <article className="pt-dash__card">
      <div className="pt-dash__card-head">
        <span className="pt-dash__card-label">Content summary</span>
      </div>
      <div className="pt-dash__card-body">
        <span className="pt-dash__card-count">{drafts ?? '—'}</span>
        <span className="pt-dash__card-caption">draft posts waiting for review</span>
      </div>
    </article>
  )
}

export default ContentSummaryWidget
