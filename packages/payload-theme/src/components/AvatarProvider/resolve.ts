/**
 * Pure avatar-resolution helpers, split out of the provider so they can be
 * unit-tested without a React tree or a live Payload instance.
 */

import type { Payload, TypedUser } from 'payload'

import type { ResolvedAvatar } from '../../options'

/** Loose field shape — enough to walk containers without fighting the union. */
export type AnyField = {
  fields?: AnyField[]
  name?: string
  relationTo?: string | string[]
  tabs?: { fields: AnyField[]; name?: string }[]
  type?: string
}

/** Walk a dot path on a plain object, tolerating anything non-object midway. */
export const valueAtPath = (source: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[segment]
  }, source)

/**
 * Find a field config by dot path. Presentational containers (row,
 * collapsible, unnamed tabs) don't add a path segment, so they're searched
 * with the same segments; named groups and tabs consume one.
 */
export function findField(fields: AnyField[] | undefined, segments: string[]): AnyField | null {
  if (!Array.isArray(fields) || segments.length === 0) return null
  const [head, ...rest] = segments

  for (const field of fields) {
    if (field.name === head) {
      if (rest.length === 0) return field
      return findField(field.fields, rest)
    }
    if (!field.name && Array.isArray(field.fields)) {
      const found = findField(field.fields, segments)
      if (found) return found
    }
    if (Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        const found = tab.name
          ? tab.name === head
            ? findField(tab.fields, rest)
            : null
          : findField(tab.fields, segments)
        if (found) return found
      }
    }
  }
  return null
}

/** True for something usable as an `<img src>` — absolute, root-relative or data. */
export const isImageURL = (value: string): boolean =>
  /^(https?:\/\/|\/\/|\/|data:image\/)/.test(value)

/**
 * A URL out of whatever the field holds: a plain string URL, or a populated
 * upload doc — preferring the named `size` when one is configured, since an
 * avatar has no business loading the original file.
 */
export function toImageURL(value: unknown, size: null | string): null | string {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed && isImageURL(trimmed) ? trimmed : null
  }
  if (value && typeof value === 'object') {
    const doc = value as { sizes?: Record<string, { url?: unknown }>; url?: unknown }
    if (size) {
      const sized = doc.sizes?.[size]?.url
      if (typeof sized === 'string' && sized.trim()) return sized
    }
    if (typeof doc.url === 'string' && doc.url.trim()) return doc.url
  }
  return null
}

/**
 * Gravatar URL for an email. Hashed with SHA-256 — Gravatar's current
 * recommendation, and reachable through Web Crypto everywhere Payload runs,
 * so this needs no md5 dependency. `d=mp` serves the neutral silhouette when
 * the address has no Gravatar.
 */
export async function gravatarURL(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase())
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `https://www.gravatar.com/avatar/${hash}?d=mp&r=g&s=160`
}

/** Resolve `avatar: { field }` against the logged-in user's document. */
export async function resolveFieldAvatar(
  payload: Payload,
  user: TypedUser,
  source: Extract<ResolvedAvatar, { type: 'field' }>,
): Promise<null | string> {
  const raw = valueAtPath(user, source.name)
  if (raw === undefined || raw === null) return null

  // Already usable: a text/URL field, or a relationship populated because the
  // project raised its auth `depth`.
  const direct = toImageURL(raw, source.size)
  if (direct) return direct

  // Otherwise it's an unpopulated relationship — an ID. Find what it points
  // at, then read just that one doc (never the whole user again).
  if (typeof raw !== 'string' && typeof raw !== 'number') return null

  const collection = payload.config.collections.find(
    (candidate) => candidate.slug === user.collection,
  )
  const field = findField(collection?.fields as AnyField[] | undefined, source.name.split('.'))
  const relationTo = field?.relationTo
  if (typeof relationTo !== 'string') return null

  try {
    const doc = await payload.findByID({
      id: raw,
      collection: relationTo,
      depth: 0,
      disableErrors: true,
      overrideAccess: false,
      user,
    })
    return toImageURL(doc, source.size)
  } catch {
    // A deleted upload, or a user without read access on the media collection:
    // fall back to initials rather than breaking every admin page.
    return null
  }
}
