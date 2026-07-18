'use client'

import { useTranslation } from '@payloadcms/ui'
import React from 'react'

/**
 * Replacement list-view cell for checkbox fields, registered per-field by the
 * plugin. Stock Payload prints a raw `true` / `false` code chip — the rawest
 * corner of the panel. This renders a small round chip instead: a green tick
 * for true, a muted X for false. Icon-only; the localized yes/no lives in the
 * accessible label.
 */
export const BoolCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => {
  const { t } = useTranslation()
  const truthy = cellData === true

  return (
    <span
      aria-label={truthy ? t('general:yes') : t('general:no')}
      className={`pt-bool ${truthy ? 'pt-bool--true' : 'pt-bool--false'}`}
      role="img"
    >
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        {truthy ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <React.Fragment>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </React.Fragment>
        )}
      </svg>
    </span>
  )
}

export default BoolCell
