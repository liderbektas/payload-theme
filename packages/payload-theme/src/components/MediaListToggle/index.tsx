'use client'

import React from 'react'

const STORAGE_KEY = 'payload-theme-media-view'

type MediaView = 'grid' | 'table'

/**
 * Grid/table switch rendered above upload-collection list views (the plugin
 * registers it via `admin.components.beforeListTable` on every collection with
 * `upload` enabled). The stylesheet keys the whole media-grid layout off
 * `.collection-list:has(.pt-media-toggle[data-view='grid'])`, so this
 * component's own state drives the view — no extra wiring, and the grid is
 * already applied in the server-rendered HTML (grid is the default).
 */
export const MediaListToggle: React.FC = () => {
  const [view, setView] = React.useState<MediaView>('grid')

  // localStorage is read after mount so server and client render the same
  // default; a stored "table" preference swaps the layout one paint later.
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'grid' || stored === 'table') setView(stored)
    } catch {
      /* storage unavailable (private mode) — keep the default */
    }
  }, [])

  const select = (next: MediaView) => {
    setView(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* non-persistent is fine */
    }
  }

  const buttonClass = (target: MediaView) =>
    ['pt-media-toggle__btn', view === target && 'pt-media-toggle__btn--active']
      .filter(Boolean)
      .join(' ')

  return (
    <div className="pt-media-toggle" data-view={view} role="group">
      <button
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        className={buttonClass('grid')}
        onClick={() => select('grid')}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <rect height="7" rx="1" width="7" x="3" y="3" />
          <rect height="7" rx="1" width="7" x="14" y="3" />
          <rect height="7" rx="1" width="7" x="14" y="14" />
          <rect height="7" rx="1" width="7" x="3" y="14" />
        </svg>
      </button>
      <button
        aria-label="List view"
        aria-pressed={view === 'table'}
        className={buttonClass('table')}
        onClick={() => select('table')}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </svg>
      </button>
    </div>
  )
}

export default MediaListToggle
