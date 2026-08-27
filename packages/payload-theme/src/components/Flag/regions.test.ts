import { describe, expect, it } from 'vitest'

import { localeToRegion } from './regions'

describe('localeToRegion', () => {
  it('maps a bare language to its conventional region', () => {
    expect(localeToRegion('tr')).toBe('TR')
    expect(localeToRegion('de')).toBe('DE')
    expect(localeToRegion('en')).toBe('GB')
    expect(localeToRegion('pt')).toBe('PT')
  })

  it('is case-insensitive on the language subtag', () => {
    expect(localeToRegion('TR')).toBe('TR')
    expect(localeToRegion('De')).toBe('DE')
  })

  it('prefers an explicit region subtag over the language convention', () => {
    expect(localeToRegion('en-US')).toBe('US')
    expect(localeToRegion('pt-BR')).toBe('BR')
    expect(localeToRegion('de-AT')).toBe('AT')
  })

  it('accepts underscores and lower-case regions', () => {
    expect(localeToRegion('pt_br')).toBe('BR')
    expect(localeToRegion('en_gb')).toBe('GB')
  })

  it('skips a script subtag to find the region', () => {
    expect(localeToRegion('zh-Hant-TW')).toBe('TW')
    expect(localeToRegion('sr-Latn-RS')).toBe('RS')
  })

  it('falls back to the language when only a script is present', () => {
    expect(localeToRegion('zh-Hant')).toBe('CN')
  })

  it('handles the non-BCP-47 keys Payload ships for its admin languages', () => {
    expect(localeToRegion('rsLatin')).toBe('RS')
    expect(localeToRegion('zhTw')).toBe('TW')
  })

  it('returns undefined for codes with no flag rather than guessing', () => {
    expect(localeToRegion('xx')).toBeUndefined()
    expect(localeToRegion('klingon')).toBeUndefined()
    expect(localeToRegion('')).toBeUndefined()
    expect(localeToRegion('   ')).toBeUndefined()
  })

  it('survives a non-string code', () => {
    expect(localeToRegion(undefined as unknown as string)).toBeUndefined()
    expect(localeToRegion(null as unknown as string)).toBeUndefined()
  })
})
