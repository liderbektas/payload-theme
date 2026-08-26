import { describe, expect, it } from 'vitest'

import type { AnyField } from './resolve'

import { findField, gravatarURL, toImageURL, valueAtPath } from './resolve'

describe('valueAtPath', () => {
  it('reads a top-level key and a dot path into a group', () => {
    const user = { avatar: 'a', profile: { photo: 'b' } }
    expect(valueAtPath(user, 'avatar')).toBe('a')
    expect(valueAtPath(user, 'profile.photo')).toBe('b')
  })

  it('returns undefined instead of throwing when the path breaks', () => {
    expect(valueAtPath({ avatar: 'a' }, 'avatar.url')).toBeUndefined()
    expect(valueAtPath({}, 'profile.photo')).toBeUndefined()
    expect(valueAtPath(null, 'avatar')).toBeUndefined()
  })
})

describe('findField', () => {
  const fields: AnyField[] = [
    { name: 'email', type: 'email' },
    {
      type: 'row',
      fields: [{ name: 'avatar', relationTo: 'media', type: 'upload' }],
    },
    {
      name: 'profile',
      type: 'group',
      fields: [{ name: 'photo', relationTo: 'media', type: 'upload' }],
    },
    {
      type: 'tabs',
      tabs: [
        { fields: [{ name: 'unnamedTabField', type: 'text' }] },
        { name: 'meta', fields: [{ name: 'picture', relationTo: 'media', type: 'upload' }] },
      ],
    },
  ]

  it('finds a top-level field', () => {
    expect(findField(fields, ['email'])?.type).toBe('email')
  })

  it('descends into presentational containers without consuming a segment', () => {
    expect(findField(fields, ['avatar'])?.relationTo).toBe('media')
    expect(findField(fields, ['unnamedTabField'])?.type).toBe('text')
  })

  it('consumes a segment for named groups and named tabs', () => {
    expect(findField(fields, ['profile', 'photo'])?.relationTo).toBe('media')
    expect(findField(fields, ['meta', 'picture'])?.relationTo).toBe('media')
  })

  it('returns null for unknown paths and empty input', () => {
    expect(findField(fields, ['nope'])).toBeNull()
    expect(findField(fields, ['profile', 'nope'])).toBeNull()
    expect(findField(undefined, ['email'])).toBeNull()
    expect(findField(fields, [])).toBeNull()
  })
})

describe('toImageURL', () => {
  it('accepts string URLs that a browser can actually load', () => {
    expect(toImageURL('/media/me.png', null)).toBe('/media/me.png')
    expect(toImageURL('https://cdn.test/me.png', null)).toBe('https://cdn.test/me.png')
    expect(toImageURL('data:image/png;base64,AAA', null)).toBe('data:image/png;base64,AAA')
  })

  it('rejects strings that are IDs, not URLs', () => {
    expect(toImageURL('67f0a1c3d4', null)).toBeNull()
    expect(toImageURL('   ', null)).toBeNull()
  })

  it('reads the url off a populated upload doc', () => {
    expect(toImageURL({ url: '/media/me.png' }, null)).toBe('/media/me.png')
  })

  it('prefers the requested size, falling back to the original', () => {
    const doc = { sizes: { thumbnail: { url: '/media/me-300.png' } }, url: '/media/me.png' }
    expect(toImageURL(doc, 'thumbnail')).toBe('/media/me-300.png')
    expect(toImageURL(doc, 'square')).toBe('/media/me.png')
  })

  it('returns null for anything unusable', () => {
    expect(toImageURL(undefined, null)).toBeNull()
    expect(toImageURL(42, null)).toBeNull()
    expect(toImageURL({ url: '' }, null)).toBeNull()
  })
})

describe('gravatarURL', () => {
  it('hashes the normalized email with SHA-256', async () => {
    // Reference SHA-256 of 'test@example.com' — Gravatar's documented example.
    const expected = '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
    const url = await gravatarURL('  Test@Example.com  ')
    expect(url).toBe(`https://www.gravatar.com/avatar/${expected}?d=mp&r=g&s=160`)
  })
})
