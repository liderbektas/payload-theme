import type { Access } from 'payload'

/**
 * Demo mode: when DEMO_MODE=true (the public live demo), every write is
 * blocked at the access layer — visitors can browse every screen, open
 * every document and play with every control, but Save/Delete are refused
 * by the API. Locally (no env var) everything stays writable.
 */
export const isDemo = (): boolean => process.env.DEMO_MODE === 'true'

export const canWrite: Access = () => !isDemo()

/** Spread into a collection config to block create/update/delete in demo. */
export const demoSafeWrites = {
  create: canWrite,
  update: canWrite,
  delete: canWrite,
} satisfies Record<string, Access>
