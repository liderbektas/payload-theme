'use client'

import { useConfig, useNav, useTheme } from '@payloadcms/ui'
import { DynamicIcon } from 'lucide-react/dynamic'
import React from 'react'

import type { ResolvedThemeConfig, ThemeRadius } from '../../options'

import { RADIUS_TOKENS } from '../../options'
import {
  buildTheme,
  FONT_KEYS,
  FONT_PRESETS,
  isValidHex,
  normalizeHex,
  resolveFont,
  themeToCss,
  type ThemeFontKey,
} from '../../theme'
import { UserMenu } from '../UserMenu'

/**
 * Right side of the app header: the theme customizer (palette icon), a
 * light/dark toggle and the compact user menu. Registered through
 * `admin.components.actions`, so it renders on every authed admin page.
 *
 * The customizer applies RUNTIME overrides on top of the plugin config —
 * one-click theme presets, accent (10 presets + any hex), corner radius,
 * typeface and content layout — and persists them in localStorage so they
 * survive reloads. "Copy config" turns whatever is on screen into a
 * ready-to-paste `payloadTheme({ ... })` snippet; "Reset to Default" clears
 * everything back to the `payloadTheme({ ... })` options.
 */

const STORAGE_KEY = 'payload-theme-overrides'
const OVERRIDE_STYLE_ID = 'pt-theme-override'
const FONT_LINK_ID = 'pt-font-override'

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

/** Runtime-selectable fonts: 'default' keeps the config/Payload font. */
const FONT_OPTIONS = FONT_KEYS

/**
 * One-click full themes: accent + radius + typeface applied together.
 * Neutral names on purpose — each is a coherent identity, not a brand.
 */
type FullPreset = {
  accent: string
  font: ThemeFontKey
  key: string
  label: string
  radius: ThemeRadius
}
const THEME_PRESETS: FullPreset[] = [
  { key: 'zinc', label: 'Zinc', accent: '#18181b', font: 'geist', radius: 'md' },
  { key: 'ocean', label: 'Ocean', accent: '#2563eb', font: 'inter', radius: 'lg' },
  { key: 'forest', label: 'Forest', accent: '#059669', font: 'inter', radius: 'md' },
  { key: 'sunset', label: 'Sunset', accent: '#ea580c', font: 'inter', radius: 'full' },
  { key: 'berry', label: 'Berry', accent: '#db2777', font: 'geist', radius: 'lg' },
  { key: 'swiss', label: 'Swiss', accent: '#dc2626', font: 'helvetica', radius: 'none' },
]

type Overrides = {
  accent?: string
  font?: string
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
    if (
      typeof parsed.font === 'string' &&
      parsed.font !== 'default' &&
      (FONT_OPTIONS as string[]).includes(parsed.font)
    )
      out.font = parsed.font
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

  // font → --font-body inline (beats every stylesheet) + webfont <link>
  const fontLink = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
  if (overrides.font) {
    const { stack, url } = resolveFont(overrides.font)
    if (stack) root.style.setProperty('--font-body', stack)
    if (url) {
      if (fontLink) {
        if (fontLink.href !== url) fontLink.href = url
      } else {
        const el = document.createElement('link')
        el.id = FONT_LINK_ID
        el.rel = 'stylesheet'
        el.href = url
        document.head.appendChild(el)
      }
    } else {
      fontLink?.remove()
    }
  } else {
    root.style.removeProperty('--font-body')
    fontLink?.remove()
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

/** Copy with the async clipboard API, falling back to a hidden textarea. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fall through to execCommand
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    el.remove()
    return ok
  } catch {
    return false
  }
}

/** Desktop sidebar collapse chip, pinned to the app header's LEFT edge via
 * CSS (the .pt-header-actions container sits on the right). Living inside
 * the header row keeps it perfectly aligned with the right-side buttons in
 * every scroll state — Payload's own toggler renders outside the content
 * card and could never line up. Hidden ≤1440px (the drawer has its own
 * toggler). `useNav` is Payload's context, so the grid animates as usual. */
const NavCollapse: React.FC = () => {
  const { navOpen, setNavOpen } = useNav()

  return (
    <button
      aria-expanded={navOpen}
      aria-label={navOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      className="pt-header-btn pt-nav-collapse"
      onClick={() => setNavOpen(!navOpen)}
      title={navOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      type="button"
    >
      <DynamicIcon
        aria-hidden="true"
        name={navOpen ? 'panel-left-close' : 'panel-left-open'}
        strokeWidth={1.9}
      />
    </button>
  )
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
  const [copied, setCopied] = React.useState(false)
  const copyTimer = React.useRef<number | undefined>(undefined)
  const rootRef = React.useRef<HTMLDivElement>(null)

  // Load persisted overrides once and apply them (covers full page loads).
  React.useEffect(() => {
    const stored = readOverrides()
    setOverrides(stored)
    applyOverrides(stored)
  }, [])

  React.useEffect(() => {
    return () => window.clearTimeout(copyTimer.current)
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
  const configFont = themeConfig?.font ?? 'default'
  const activeAccent = overrides.accent ?? configAccent
  const activeRadius = overrides.radius ?? configRadius
  const activeFont = overrides.font ?? configFont
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

  const pickFont = (font: string) => {
    if (font === configFont) {
      const { font: _font, ...rest } = overrides
      update(rest)
    } else {
      update({ ...overrides, font })
    }
  }

  const applyPreset = (preset: FullPreset) => {
    setHexDraft('')
    const next: Overrides = { ...overrides }
    if (normalizeHex(preset.accent) === configAccent) delete next.accent
    else next.accent = normalizeHex(preset.accent)
    if (preset.radius === configRadius) delete next.radius
    else next.radius = preset.radius
    if (preset.font === configFont) delete next.font
    else next.font = preset.font
    update(next)
  }

  const isPresetActive = (preset: FullPreset): boolean =>
    activeAccent.toLowerCase() === preset.accent.toLowerCase() &&
    activeRadius === preset.radius &&
    activeFont === preset.font

  /** The current on-screen look as a paste-ready plugin config. */
  const copyConfig = async () => {
    const lines = [`  accent: '${activeAccent}',`, `  radius: '${activeRadius}',`]
    if (activeFont !== 'default') lines.push(`  font: '${activeFont}',`)
    const snippet = `payloadTheme({\n${lines.join('\n')}\n})`
    const ok = await copyText(snippet)
    if (ok) {
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600)
    }
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
            <div className="pt-custom__label">Presets</div>
            <div className="pt-custom__presets">
              {THEME_PRESETS.map((preset) => (
                <button
                  aria-pressed={isPresetActive(preset)}
                  className={[
                    'pt-custom__preset',
                    isPresetActive(preset) && 'pt-custom__preset--active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={preset.key}
                  onClick={() => applyPreset(preset)}
                  title={`${preset.label} — ${preset.accent}, ${preset.radius}, ${FONT_PRESETS[preset.font as Exclude<ThemeFontKey, 'default'>]?.label ?? 'default'}`}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className="pt-custom__preset-dot"
                    style={{ backgroundColor: preset.accent }}
                  />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

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
              <span
                aria-hidden="true"
                className="pt-custom__hex-preview"
                style={{ backgroundColor: activeAccent }}
              />
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
            <div className="pt-custom__label">Font</div>
            <div className="pt-custom__fonts">
              {FONT_OPTIONS.map((option) => {
                const preset =
                  option === 'default'
                    ? null
                    : FONT_PRESETS[option as Exclude<ThemeFontKey, 'default'>]
                return (
                  <button
                    aria-pressed={activeFont === option}
                    className={[
                      'pt-custom__font',
                      activeFont === option && 'pt-custom__font--active',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    key={option}
                    onClick={() => pickFont(option)}
                    style={preset ? { fontFamily: preset.stack } : undefined}
                    type="button"
                  >
                    {preset?.label ?? 'Default'}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-custom__section">
            <div className="pt-custom__label">Color mode</div>
            <div className="pt-custom__segments">
              {(['light', 'dark'] as const).map((mode) => (
                <button
                  aria-pressed={theme === mode}
                  className={['pt-custom__segment', theme === mode && 'pt-custom__segment--active']
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

          <div className="pt-custom__footer">
            <button
              className={['pt-custom__copy', copied && 'pt-custom__copy--done']
                .filter(Boolean)
                .join(' ')}
              onClick={() => void copyConfig()}
              title="Copy the current look as a payloadTheme({ ... }) snippet"
              type="button"
            >
              <DynamicIcon aria-hidden="true" name={copied ? 'check' : 'clipboard'} strokeWidth={1.9} />
              {copied ? 'Copied!' : 'Copy config'}
            </button>
            <button className="pt-custom__reset" onClick={reset} type="button">
              <DynamicIcon aria-hidden="true" name="rotate-ccw" strokeWidth={1.9} />
              Reset
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export const HeaderActions: React.FC = () => {
  return (
    <div className="pt-header-actions">
      <NavCollapse />
      <Customizer />
      <ThemeToggle />
      <UserMenu variant="header" />
    </div>
  )
}

export default HeaderActions
