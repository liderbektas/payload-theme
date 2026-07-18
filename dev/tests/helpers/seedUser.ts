import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'dev@payloadcms.com',
  password: 'test',
  role: 'admin' as const,
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: testUser,
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}

/**
 * Empties a collection — used by tests that need a deterministic empty state
 * regardless of what the demo seed (or a previous run) left behind.
 */
export async function clearCollection(slug: 'media' | 'posts' | 'tags'): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: slug,
    where: {
      id: {
        exists: true,
      },
    },
  })
}
