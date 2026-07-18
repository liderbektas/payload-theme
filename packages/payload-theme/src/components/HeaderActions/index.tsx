'use client'

import { useConfig, useTheme } from '@payloadcms/ui'
import { DynamicIcon } from 'lucide-react/dynamic'
import React from 'react'

import type { ResolvedThemeConfig, ThemeRadius } from '../../options'

import { RADIUS_TOKENS } from '../../options'
import { buildTheme, isValidHex, normalizeHex, themeToCss } from '../../theme'
import { UserMenu } from '../UserMenu'

/**
 * Right side of the app header: the theme customizer (palette icon), a
 * light/dark toggle and the compact user menu. Registered through
 * `admin.components.actions`, so it renders on every authed admin page.
 *
 * The customizer applies RUNTIME overrides on top of the plugin config —
 * accent (10 presets + any hex), corner radius and content layout — and
 * persists them in localStorage so they survive reloads. "Reset to Default"
 * clears everything back to the `payloadTheme({ ... })` options.
 */

const STORAGE_KEY = 'payload-theme-overrides'
const OVERRIDE_STYLE_ID = 'pt-theme-override'

/** 10 curated accents (the swatch row); any custom hex works via the input. */
const PRESET_ACCENTS = [
  '#18181b', // zinc
  '#4f4ece', // indigo (theme default)
  '#2563eb', // blue
  '#0284c7', // sky
  '#0d9488', // teal
  '#059669', // emerald
  '#ea580c', // orange
  '#dc2626', // red
  '#db2777', // pink
  '#7c3aed', // violet
]

const RADIUS_OPTIONS: ThemeRadius[] = ['none', 'sm', 'md', 'lg', 'full']

type Overrides = {
  accent?: string
  layout?: 'centered' | 'full'
  radius?: ThemeRadius
}

function readOverrides(): Overrides {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Overrides
    const out: Overrides = {}
    if (typeof parsed.accent === 'string' && isValidHex(parsed.accent)) out.accent = parsed.accent
    if (parsed.radius && RADIUS_OPTIONS.includes(parsed.radius)) out.radius = parsed.radius
    if (parsed.layout === 'full' || parsed.layout === 'centered') out.layout = parsed.layout
    return out
  } catch {
    return {}
  }
}

/** Apply (or clear) every override on the live document. Pure DOM — the
 * injected <style> comes after the ThemeProvider's, so it wins in-layer. */
function applyOverrides(overrides: Overrides): void {
  const root = document.documentElement

  // accent → recompute the full scale client-side (same engine as the server).
  // Doubled selectors out-rank the ThemeProvider's :root block (which sits
  // later in document order, inside <body>) at equal cascade layer.
  const existing = document.getElementById(OVERRIDE_STYLE_ID)
  if (overrides.accent) {
    let css: null | string = null
    try {
      css = themeToCss(buildTheme(overrides.accent), {
        darkSelector: "html[data-theme='dark']:root",
        rootSelector: ':root:root',
      })
    } catch {
      // an unparsable hex must never break the panel — just skip applying
    }
    if (css) {
      if (existing) {
        existing.textContent = css
      } else {
        const el = document.createElement('style')
        el.id = OVERRIDE_STYLE_ID
        el.textContent = css
        document.head.appendChild(el)
      }
    }
  } else {
    existing?.remove()
  }

  // radius → the three tokens the whole stylesheet reads
  if (overrides.radius) {
    const tokens = RADIUS_TOKENS[overrides.radius]
    root.style.setProperty('--pt-radius-card', tokens.card)
    root.style.setProperty('--pt-radius-ctl', tokens.ctl)
    root.style.setProperty('--pt-radius-item', tokens.item)
  } else {
    root.style.removeProperty('--pt-radius-card')
    root.style.removeProperty('--pt-radius-ctl')
    root.style.removeProperty('--pt-radius-item')
  }

  // content layout → the container cap variable
  if (overrides.layout === 'full') {
    root.style.setProperty('--pt-content-width', '100%')
  } else {
    root.style.removeProperty('--pt-content-width')
  }
}

function persistOverrides(overrides: Overrides): void {
  try {
    if (Object.keys(overrides).length === 0) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
  } catch {
    // storage may be unavailable (private mode) — overrides still apply live
  }
}

/** Sun/moon toggle. `useTheme` is Payload's own hook, so the choice lands in
 * the same preference store as the Account page's "Admin Theme" radios. */
const ThemeToggle: React.FC = () => {
  const { setTheme, theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="pt-header-btn"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Light mode' : 'Dark mode'}
      type="button"
    >
      <DynamicIcon aria-hidden="true" name={isDark ? 'sun' : 'moon'} strokeWidth={1.9} />
    </button>
  )
}

const Customizer: React.FC = () => {
  const { config } = useConfig()
  const { setTheme, theme } = useTheme()
  const themeConfig = config.admin?.custom?.payloadTheme as ResolvedThemeConfig | undefined

  const [open, setOpen] = React.useState(false)
  const [overrides, setOverrides] = React.useState<Overrides>({})
  const [hexDraft, setHexDraft] = React.useState('')
  const rootRef = React.useRef<HTMLDivElement>(null)

  // Load persisted overrides once and apply them (covers full page loads).
  React.useEffect(() => {
    const stored = readOverrides()
    setOverrides(stored)
    applyOverrides(stored)
  }, [])

  // Close on outside click / ESC while open.
  React.useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const update = (next: Overrides) => {
    setOverrides(next)
    applyOverrides(next)
    persistOverrides(next)
  }

  const configAccent = themeConfig?.accent ?? '#4f4ece'
  const configRadius = themeConfig?.radius ?? 'md'
  const activeAccent = overrides.accent ?? configAccent
  const activeRadius = overrides.radius ?? configRadius
  const activeLayout = overrides.layout ?? 'centered'

  const pickAccent = (hex: string) => {
    const normalized = normalizeHex(hex)
    setHexDraft('')
    if (normalized === configAccent) {
      const { accent: _accent, ...rest } = overrides
      update(rest)
    } else {
      update({ ...overrides, accent: normalized })
    }
  }

  const onHexInput = (raw: string) => {
    const value = raw.startsWith('#') || raw === '' ? raw : `#${raw}`
    setHexDraft(value)
    if (isValidHex(value)) pickAccent(value)
  }

  const reset = () => {
    update({})
    setHexDraft('')
  }

  // The panel-configured accent leads the swatch row; the curated presets
  // follow (minus a duplicate of the configured color).
  const swatches = React.useMemo(() => {
    const rest = PRESET_ACCENTS.filter((hex) => hex.toLowerCase() !== configAccent.toLowerCase())
    return [configAccent, ...rest].slice(0, PRESET_ACCENTS.length)
  }, [configAccent])

  return (
    <div className="pt-custom" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Theme settings"
        className="pt-header-btn"
        onClick={() => setOpen((current) => !current)}
        title="Theme settings"
        type="button"
      >
        <DynamicIcon aria-hidden="true" name="palette" strokeWidth={1.9} />
      </button>
      {open ? (
        <div aria-label="Theme settings" className="pt-custom__panel" role="dialog">
          <div className="pt-custom__section">
            <div className="pt-custom__label">Accent</div>
            <div className="pt-custom__swatches">
              {swatches.map((hex) => (
                <button
                  aria-label={`Accent ${hex}`}
                  aria-pressed={activeAccent.toLowerCase() === hex.toLowerCase()}
                  className={[
                    'pt-custom__swatch',
                    activeAccent.toLowerCase() === hex.toLowerCase() && 'pt-custom__swatch--active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={hex}
                  onClick={() => pickAccent(hex)}
                  style={{ backgroundColor: hex }}
                  title={hex}
                  type="button"
                />
              ))}
            </div>
            <div className="pt-custom__hex">
              <span aria-hidden="true" className="pt-custom__hex-preview" style={{ backgroundColor: activeAccent }} />
              <input
                aria-label="Custom accent hex"
                className="pt-custom__hex-input"
                maxLength={7}
                onChange={(event) => onHexInput(event.target.value)}
                placeholder={activeAccent}
                spellCheck={false}
                type="text"
                value={hexDraft}
              />
            </div>
          </div>

          <div className="pt-custom__section">
            <div className="pt-custom__label">Radius</div>
            <div className="pt-custom__segments">
              {RADIUS_OPTIONS.map((option) => (
                <button
                  aria-pressed={activeRadius === option}
                  className={[
                    'pt-custom__segment',
                    activeRadius === option && 'pt-custom__segment--active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={option}
                  onClick={() => {
                    if (option === configRadius) {
                      const { radius: _radius, ...rest } = overrides
                      update(rest)
                    } else {
                      update({ ...overrides, radius: option })
                    }
                  }}
                  type="button"
                >
                  {option === 'none' ? (
                    <DynamicIcon aria-hidden="true" name="ban" strokeWidth={1.9} />
                  ) : (
                    option.toUpperCase()
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-custom__section">
            <div className="pt-custom__label">Color mode</div>
            <div className="pt-custom__segments">
              {(['light', 'dark'] as const).map((mode) => (
                <button
                  aria-pressed={theme === mode}
                  className={[
                    'pt-custom__segment',
                    theme === mode && 'pt-custom__segment--active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={mode}
                  onClick={() => setTheme(mode)}
                  type="button"
                >
                  {mode === 'light' ? 'Light' : 'Dark'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-custom__section">
            <div className="pt-custom__label">Content layout</div>
            <div className="pt-custom__segments">
              {(['centered', 'full'] as const).map((mode) => (
                <button
                  aria-pressed={activeLayout === mode}
                  className={[
                    'pt-custom__segment',
                    activeLayout === mode && 'pt-custom__segment--active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={mode}
                  onClick={() => {
                    if (mode === 'centered') {
                      const { layout: _layout, ...rest } = overrides
                      update(rest)
                    } else {
                      update({ ...overrides, layout: mode })
                    }
                  }}
                  type="button"
                >
                  {mode === 'centered' ? 'Centered' : 'Full'}
                </button>
              ))}
            </div>
          </div>

          <button className="pt-custom__reset" onClick={reset} type="button">
            <DynamicIcon aria-hidden="true" name="rotate-ccw" strokeWidth={1.9} />
            Reset to Default
          </button>
        </div>
      ) : null}
    </div>
  )
}

export const HeaderActions: React.FC = () => {
  return (
    <div className="pt-header-actions">
      <Customizer />
      <ThemeToggle />
      <UserMenu variant="header" />
    </div>
  )
}

export default HeaderActions
