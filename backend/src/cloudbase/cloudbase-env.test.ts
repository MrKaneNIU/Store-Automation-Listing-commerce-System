import { describe, expect, it } from 'vitest'

import { parseCloudBaseEnv } from './cloudbase-env'

describe('CloudBase environment parsing', () => {
  it('requires a CloudBase environment id before real deployment work starts', () => {
    expect(() => parseCloudBaseEnv({})).toThrow('CLOUDBASE_ENV_ID is required')
  })

  it('parses the approved CloudBase staging boundary without secrets', () => {
    expect(
      parseCloudBaseEnv({
        CLOUDBASE_ENV_ID: 'vx-mall-staging-123',
        CLOUDBASE_REGION: 'ap-shanghai',
        CLOUDBASE_BILLING_MODE: 'free-quota',
      }),
    ).toEqual({
      envId: 'vx-mall-staging-123',
      region: 'ap-shanghai',
      billingMode: 'free-quota',
    })
  })

  it('rejects unknown billing modes so cost posture is explicit', () => {
    expect(() =>
      parseCloudBaseEnv({
        CLOUDBASE_ENV_ID: 'vx-mall-staging-123',
        CLOUDBASE_BILLING_MODE: 'unknown',
      }),
    ).toThrow('CLOUDBASE_BILLING_MODE must be free-quota or billing-enabled')
  })
})
