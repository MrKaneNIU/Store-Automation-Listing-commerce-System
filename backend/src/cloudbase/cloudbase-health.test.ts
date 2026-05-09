import { describe, expect, it } from 'vitest'

import { createCloudBaseHealthEnvelope } from './cloudbase-health'

describe('CloudBase health cloud function contract', () => {
  it('returns a unified success envelope without leaking credentials', () => {
    const envelope = createCloudBaseHealthEnvelope({
      envId: 'vx-mall-staging-123',
      region: 'ap-shanghai',
      billingMode: 'free-quota',
    })

    expect(envelope).toEqual({
      success: true,
      data: {
        service: 'cloudbase',
        envId: 'vx-mall-staging-123',
        region: 'ap-shanghai',
        billingMode: 'free-quota',
        requiredCollections: 14,
      },
      error: null,
      meta: {},
    })
  })
})
