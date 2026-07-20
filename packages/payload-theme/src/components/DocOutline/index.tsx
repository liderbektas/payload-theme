'use client'

import { useConfig } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React from 'react'
import { createPortal } from 'react-dom'

/**
 * Sticky document outline for long edit forms — a compact rail of bars pinned
 * to the viewport's right edge that expands into a labeled table of contents
 * on hover/focus. Entries are the form's top-level SECTIONS (groups,
 * collapsibles, blocks, arrays, tabs); clicking one scrolls it under the
 * sticky header, the active section tracks the scroll position.
 *
 * Pure progressive enhancement: it reads the rendered DOM (no field-schema
 * coupling), renders nothing when a form has fewer than 3 sections, and hides
 * on viewports without spare room. A MutationObserver rescans (debounced)
 * when the form re-renders — switching tabs, adding blocks, etc.
 */

type Section = {
  el: HTMLElement
  id: string
  label: string
  /** For tab entries: the tab button to activate before scrolling. */
  tabButton?: HTMLElement
}

/** Top-level field wrappers that read as document "sections". */
const SECTION_SELECTOR = [
  '.group-field--top-level',
  '.collapsible-field',
  '.blocks-field',
  '.array-field',
  '.tabs-field',
].join(', ')

/** Best-effort label for a section element, in specificity order. */
function sectionLabel(el: HTMLElement): null | string {
  const candidates = [
    '.group-field__title',
    ':scope > .collapsible__toggle-wrap .row-label',
    ':scope .field-label',
    ':scope header h3',
  ]
  for (const selector of candidates) {
    const text = el.querySelector(selector)?.textContent?.trim()
    if (text) return text.replace(/\s*\*\s*$/, '') // strip required-field mark
  }
  return null
}

const SCROLL_OFFSET = 110 // clears the sticky app header + doc controls bar

export const DocOutline: React.FC = () => {
  const { config } = useConfig()
  const pathname = usePathname()
  const [sections, setSections] = React.useState<Section[]>([])
  const [activeId, setActiveId] = React.useState<null | string>(null)

  const adminRoute = config.routes.admin
  const base = adminRoute === '/' ? '' : adminRoute

  // Only on document edit views (collection docs incl. create, and globals).
  const isEditView = React.useMemo(() => {
    const rel = pathname.startsWith(base) ? pathname.slice(base.length) : null
    if (!rel) return false
    return /^\/collections\/[^/]+\/[^/]+\/?$/.test(rel) || /^\/globals\/[^/]+\/?$/.test(rel)
  }, [pathname, base])

  // ---- scan the rendered form for sections ----------------------------------
  React.useEffect(() => {
    if (!isEditView) {
      setSections([])
      return
    }

    let timer: number | undefined

    const scan = () => {
      const container = document.querySelector('.document-fields__fields')
      if (!container) {
        setSections([])
        return
      }
      const found: Section[] = []
      const seen = new Set<string>()
      container.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach((el, index) => {
        // Only top-level sections: skip anything nested inside another section.
        if (el.parentElement?.closest(SECTION_SELECTOR)) return

        // Tabs expand into one entry per tab — clicking switches the tab.
        if (el.classList.contains('tabs-field')) {
          const buttons = el
            .querySelector(':scope > .tabs-field__tabs-wrap')
            ?.querySelectorAll<HTMLElement>('.tabs-field__tab-button')
          buttons?.forEach((button, tabIndex) => {
            const label = button.textContent?.trim()
            if (!label) return
            let id = `tab-${label}-${index}-${tabIndex}`
            while (seen.has(id)) id += '_'
            seen.add(id)
            found.push({ el, id, label, tabButton: button })
          })
          return
        }

        const label = sectionLabel(el)
        if (!label) return
        let id = `${label}-${index}`
        while (seen.has(id)) id += '_'
        seen.add(id)
        found.push({ el, id, label })
      })
      setSections((current) => {
        // Keep referential stability when nothing changed (avoids re-renders).
        if (
          current.length === found.length &&
          current.every(
            (s, i) =>
              s.el === found[i].el &&
              s.label === found[i].label &&
              s.tabButton === found[i].tabButton,
          )
        )
          return current
        return found
      })
    }

    const debouncedScan = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(scan, 250)
    }

    // First scan after paint; the form streams in, so retry once shortly after.
    scan()
    timer = window.setTimeout(scan, 600)

    const observer = new MutationObserver(debouncedScan)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [isEditView, pathname])

  // ---- active-section tracking ----------------------------------------------
  React.useEffect(() => {
    if (sections.length === 0) return

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // Only the selected tab may claim the active state from scrolling —
        // inactive tabs sit at the same position as the tabs field.
        const eligible = sections.filter(
          (section) => !section.tabButton || section.tabButton.className.includes('--active'),
        )
        // Pinned to the page bottom → the last section is active even if it
        // never reaches the top of the viewport.
        const atBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
        let current: null | string = eligible[0]?.id ?? null
        if (atBottom) {
          current = eligible[eligible.length - 1]?.id ?? current
        } else {
          for (const section of eligible) {
            if (section.el.getBoundingClientRect().top <= SCROLL_OFFSET + 40) current = section.id
            else break
          }
        }
        setActiveId(current)
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [sections])

  if (!isEditView || sections.length < 3) return null
  if (typeof document === 'undefined') return null

  const jump = (section: Section) => {
    if (section.tabButton && !section.tabButton.className.includes('--active'))
      section.tabButton.click()
    const top = section.el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ behavior: reduceMotion ? 'auto' : 'smooth', top })
    setActiveId(section.id)
  }

  return createPortal(
    <nav aria-label="Document outline" className="pt-toc">
      <div className="pt-toc__rail" aria-hidden="true">
        {sections.map((section) => (
          <span
            className={['pt-toc__tick', section.id === activeId && 'pt-toc__tick--active']
              .filter(Boolean)
              .join(' ')}
            key={section.id}
          />
        ))}
      </div>
      <div className="pt-toc__panel">
        <div className="pt-toc__panel-title">On this page</div>
        {sections.map((section) => (
          <button
            className={['pt-toc__item', section.id === activeId && 'pt-toc__item--active']
              .filter(Boolean)
              .join(' ')}
            key={section.id}
            onClick={() => jump(section)}
            type="button"
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>,
    document.body,
  )
}

export default DocOutline
