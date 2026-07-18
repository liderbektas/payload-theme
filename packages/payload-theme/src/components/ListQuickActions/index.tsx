'use client'

import { toast, useConfig, useTranslation } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

const CELL_CLASS = 'pt-actions-cell'
const ARM_TIMEOUT = 2600

const PENCIL_SVG =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>'
const TRASH_SVG =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>'

/**
 * Persistent row actions for list views: every table row gets an actions cell
 * pinned to the table's right edge with an Edit link and a two-step Delete
 * button (first click arms a red "Delete?", second click commits through
 * Payload's REST endpoint and refreshes the route).
 *
 * Registered as a provider (children pass through untouched) so ONE instance
 * serves every list view. The cells are appended to Payload's own table markup
 * via a MutationObserver: the decorator is idempotent (marker class), so the
 * observer settles immediately after each pass, and rows re-rendered by React
 * are simply re-decorated. The collection + id come from the row's own edit
 * link, so rows without a document link (or trash rows) get an empty spacer
 * cell and nothing else.
 */
export const ListQuickActions: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig()
  const { t } = useTranslation()
  const router = useRouter()

  React.useEffect(() => {
    const apiBase = `${config.serverURL || ''}${config.routes.api}`

    const deleteDoc = async (slug: string, id: string) => {
      try {
        const res = await fetch(`${apiBase}/${slug}/${encodeURIComponent(id)}`, {
          credentials: 'include',
          method: 'DELETE',
        })
        if (!res.ok) throw new Error('delete failed')
        toast.success(t('general:deletedSuccessfully'))
        router.refresh()
      } catch {
        toast.error(t('error:unknown'))
      }
    }

    const buildCell = (row: HTMLTableRowElement): HTMLTableCellElement => {
      const td = document.createElement('td')
      td.className = CELL_CLASS

      const href = row.querySelector('a[href*="/collections/"]')?.getAttribute('href') ?? ''
      const match =
        href && !href.includes('/trash/') ? /\/collections\/([^/]+)\/([^/?#]+)\/?$/.exec(href) : null
      if (!match) return td // spacer keeps the column aligned

      const [, slug, encodedID] = match

      const edit = document.createElement('a')
      edit.className = 'pt-actions__btn'
      edit.href = href
      edit.title = t('general:edit')
      edit.setAttribute('aria-label', t('general:edit'))
      edit.innerHTML = PENCIL_SVG
      edit.addEventListener('click', (event) => {
        // plain left-click → client navigation; modified clicks keep native behavior
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        router.push(href)
      })

      const del = document.createElement('button')
      del.type = 'button'
      del.className = 'pt-actions__btn pt-actions__btn--danger'
      del.title = t('general:delete')
      del.setAttribute('aria-label', t('general:delete'))
      del.innerHTML = TRASH_SVG
      let disarm: ReturnType<typeof setTimeout> | undefined
      del.addEventListener('click', () => {
        if (del.classList.contains('pt-actions__btn--armed')) {
          if (disarm) clearTimeout(disarm)
          del.disabled = true
          void deleteDoc(slug, decodeURIComponent(encodedID))
          return
        }
        del.classList.add('pt-actions__btn--armed')
        del.textContent = `${t('general:delete')}?`
        disarm = setTimeout(() => {
          del.classList.remove('pt-actions__btn--armed')
          del.innerHTML = TRASH_SVG
        }, ARM_TIMEOUT)
      })

      td.append(edit, del)
      return td
    }

    const decorate = () => {
      document
        .querySelectorAll<HTMLTableElement>('.collection-list .table > table')
        .forEach((tableEl) => {
          const headRow = tableEl.querySelector('thead tr')
          if (headRow && !headRow.querySelector(`.${CELL_CLASS}`)) {
            const th = document.createElement('th')
            th.className = CELL_CLASS
            th.setAttribute('aria-hidden', 'true')
            headRow.appendChild(th)
          }
          tableEl.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((row) => {
            if (row.querySelector(`:scope > .${CELL_CLASS}`)) return
            row.appendChild(buildCell(row))
          })
        })
    }

    // idempotent, so the observer settles right after each decoration pass
    const observer = new MutationObserver(decorate)
    observer.observe(document.body, { childList: true, subtree: true })
    decorate()
    return () => observer.disconnect()
  }, [config, router, t])

  return <React.Fragment>{children}</React.Fragment>
}

export default ListQuickActions
