'use client'

import { useAuth } from '@payloadcms/ui'
import { DynamicIcon } from 'lucide-react/dynamic'
import React from 'react'
import { createPortal } from 'react-dom'

/**
 * Keyboard-shortcuts cheatsheet. Opens on `?` anywhere in the panel (unless
 * typing in a field) and via the palette's "Keyboard shortcuts" action
 * (`pt:open-shortcuts`). Mounted once by the Nav, renders nothing until
 * opened. Same zero-dependency portal pattern as the command palette.
 */

type ShortcutRow = {
  keys: string[]
  label: string
}

type ShortcutSection = {
  rows: ShortcutRow[]
  title: string
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export const ShortcutsModal: React.FC = () => {
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [isMac, setIsMac] = React.useState(true)

  React.useEffect(() => {
    setIsMac(!/win|linux/i.test(typeof navigator === 'undefined' ? '' : navigator.platform))
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isEditableTarget(event.target)) return
        event.preventDefault()
        setOpen((current) => !current)
      } else if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpenEvent = () => setOpen(true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pt:open-shortcuts', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pt:open-shortcuts', onOpenEvent)
    }
  }, [])

  if (!user || !open) return null
  if (typeof document === 'undefined') return null

  const mod = isMac ? '⌘' : 'Ctrl'
  const sections: ShortcutSection[] = [
    {
      rows: [
        { keys: [mod, 'K'], label: 'Open the command palette' },
        { keys: ['?'], label: 'Keyboard shortcuts' },
        { keys: ['Esc'], label: 'Close dialogs and popovers' },
      ],
      title: 'Global',
    },
    {
      rows: [
        { keys: ['↑', '↓'], label: 'Move through results' },
        { keys: ['↵'], label: 'Open the selected result' },
        { keys: [mod, 'K'], label: 'Close the palette' },
      ],
      title: 'Command palette',
    },
    {
      rows: [{ keys: [mod, 'S'], label: 'Save the document (Payload built-in)' }],
      title: 'Edit view',
    },
  ]

  return createPortal(
    <div className="pt-shortcuts" role="presentation">
      <div aria-hidden="true" className="pt-shortcuts__backdrop" onClick={() => setOpen(false)} />
      <div
        aria-label="Keyboard shortcuts"
        aria-modal="true"
        className="pt-shortcuts__panel"
        role="dialog"
      >
        <div className="pt-shortcuts__head">
          <span className="pt-shortcuts__title">
            <DynamicIcon aria-hidden="true" name="keyboard" strokeWidth={1.9} />
            Keyboard shortcuts
          </span>
          <button
            aria-label="Close"
            className="pt-shortcuts__close"
            onClick={() => setOpen(false)}
            type="button"
          >
            <DynamicIcon aria-hidden="true" name="x" strokeWidth={2} />
          </button>
        </div>
        <div className="pt-shortcuts__body">
          {sections.map((section) => (
            <div className="pt-shortcuts__section" key={section.title}>
              <div className="pt-shortcuts__section-title">{section.title}</div>
              {section.rows.map((row) => (
                <div className="pt-shortcuts__row" key={row.label}>
                  <span className="pt-shortcuts__row-label">{row.label}</span>
                  <span className="pt-shortcuts__keys">
                    {row.keys.map((key) => (
                      <kbd key={key}>{key}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ShortcutsModal
