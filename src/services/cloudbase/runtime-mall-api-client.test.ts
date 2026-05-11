import { describe, expect, it } from 'vitest'

import { createRuntimeCloudBaseError } from './runtime-mall-api-client'

describe('runtime CloudBase mall API client', () => {
  it('maps WeChat environment-not-found errors to an operator-readable message', () => {
    const error = createRuntimeCloudBaseError(
      new Error('cloud.callFunction:fail Error: errCode: -501000 | errMsg: Environment not found'),
      'cloud1-d7gifjyzl7721b383',
    )

    expect(error.message).toContain('CloudBase environment not found')
    expect(error.message).toContain('cloud1-d7gifjyzl7721b383')
    expect(error.message).toContain('current mini-program AppID')
  })
})
