import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

import { describe, it, beforeAll, expect } from 'vitest'

let payload: Payload

describe('payload-theme plugin', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  it('defaults to no dashboard widgets and registers no import-map dependencies', () => {
    const theme = payload.config.admin?.custom?.payloadTheme as {
      dashboard: { widgets: unknown[] }
    }
    expect(theme.dashboard.widgets).toEqual([])

    const dependencies = payload.config.admin?.dependencies ?? {}
    expect(Object.keys(dependencies).filter((key) => key.startsWith('payload-theme-widget'))).toEqual([])
  })
})
