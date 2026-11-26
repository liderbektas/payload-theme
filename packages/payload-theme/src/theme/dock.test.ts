import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { dockedBandQuery, dockedNavToCss, drawerQuery } from './dock.js'

describe('media queries', () => {
  it('docks from the option up to Payload’s 1440px', () => {
    expect(dockedBandQuery(1280)).toBe('(min-width: 1280px) and (max-width: 1440px)')
  })

  it('keeps the drawer up to 1440px by default, and below the option when set', () => {
    expect(drawerQuery(null)).toBe('(max-width: 1440px)')
    expect(drawerQuery(1280)).toBe('(max-width: 1440px) and (not (min-width: 1280px))')
  })
})

describe('dockedNavToCss', () => {
  it('emits nothing by default, so existing users keep the drawer up to 1440px', () => {
    expect(dockedNavToCss(null)).toBe('')
  })

  it('scopes the band to the configured width inside the payload layer', () => {
    const css = dockedNavToCss(1280)
    expect(
      css.startsWith('@layer payload {\n  @media (min-width: 1280px) and (max-width: 1440px) {'),
    ).toBe(true)
    expect(css).toContain(':root:root .app-header__mobile-nav-toggler')
  })
})

// --- drift guard -----------------------------------------------------------
// The band undoes the stylesheet's drawer. Its list of properties is derived
// from the stylesheet itself, so a property added to the drawer later fails
// here instead of silently staying an overlay inside the band.

const styleFiles = [
  '../styles/layout/responsive.css',
  '../styles/layout/frame.css',
  '../styles/components/header-actions.css',
]
const DRAWER_OR_DOCKED = /\(max-width:\s*1440px\)|\(min-width:\s*1441px\)/

interface Declaration {
  property: string
  selector: string
}

/** Declarations inside the `max-width: 1440px` / `min-width: 1441px` at-rules, nesting included. */
function declarationsAround1440(css: string, inScope = false): Declaration[] {
  const found: Declaration[] = []
  let cursor = 0
  while (cursor < css.length) {
    const open = css.indexOf('{', cursor)
    if (open === -1) break
    const prelude = css.slice(cursor, open).trim()
    let depth = 1
    let end = open + 1
    while (end < css.length && depth > 0) {
      if (css[end] === '{') depth++
      else if (css[end] === '}') depth--
      end++
    }
    const body = css.slice(open + 1, end - 1)
    if (prelude.startsWith('@')) {
      found.push(...declarationsAround1440(body, inScope || DRAWER_OR_DOCKED.test(prelude)))
    } else if (inScope) {
      for (const declaration of body.split(';')) {
        const property = /^\s*([a-z-]+)\s*:/.exec(declaration)?.[1]
        if (property) found.push({ property, selector: prelude })
      }
    }
    cursor = end
  }
  return found
}

describe('the docked band undoes every drawer property', () => {
  const css = dockedNavToCss(1280)
  const declarations = styleFiles.flatMap((file) =>
    declarationsAround1440(
      readFileSync(new URL(file, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''),
    ),
  )
  // the scrim is `display: none` in the band, whatever else the drawer paints on it
  const properties = new Set(
    declarations
      .filter(({ selector }) => !selector.includes('pt-nav__backdrop'))
      .map((d) => d.property),
  )

  it('reads the drawer out of the stylesheet', () => {
    // a parser that finds nothing would make the check below vacuous
    expect(properties.size).toBeGreaterThan(15)
    expect(properties).toContain('transform')
    expect(properties).toContain('grid-template-columns')
  })

  it.each([...properties])('handles %s', (property) => {
    expect(css).toMatch(new RegExp(`(^|[\\s;{])${property}\\s*:`))
  })
})
