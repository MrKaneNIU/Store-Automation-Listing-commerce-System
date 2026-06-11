import { describe, expect, it, vi } from 'vitest'

import type { CloudBaseMallApiClient, CustomerProfileSnapshot } from '../../services/cloudbase/mall-api-client'
import { getCloudBaseCustomerProfileView, saveCloudBaseCustomerProfile } from './customer-profile'

const createSnapshot = (nickname = 'Ada'): CustomerProfileSnapshot => ({
  customerId: 'customer-1',
  profile: {
    customerId: 'customer-1',
    nickname,
    avatarUrl: 'cloud://avatar.png',
  },
  serverTime: '2026-06-11T00:00:00.000Z',
})

describe('cloudbase customer profile facade', () => {
  it('loads profile through the mall API client and returns a page-facing view', async () => {
    const getCustomerProfileSnapshot = vi.fn(async () => createSnapshot('Ada'))
    const client = {
      getCustomerProfileSnapshot,
    } as Partial<CloudBaseMallApiClient> as CloudBaseMallApiClient

    const view = await getCloudBaseCustomerProfileView(client)

    expect(getCustomerProfileSnapshot).toHaveBeenCalledTimes(1)
    expect(view).toMatchObject({
      customerId: 'customer-1',
      nickname: 'Ada',
      avatarUrl: 'cloud://avatar.png',
      loadingState: 'idle',
    })
  })

  it('converts load failures into retryable failure views', async () => {
    const view = await getCloudBaseCustomerProfileView({} as CloudBaseMallApiClient)

    expect(view.loadingState).toBe('failed')
    expect(view.failureMessage).toBe('Customer profile action is unavailable')
  })

  it('saves only editable profile fields without client identity authority', async () => {
    const updateCustomerProfile = vi.fn(async () => createSnapshot('Grace'))
    const client = {
      updateCustomerProfile,
    } as Partial<CloudBaseMallApiClient> as CloudBaseMallApiClient

    const view = await saveCloudBaseCustomerProfile(
      {
        nickname: 'Grace',
        avatarUrl: 'https://example.com/avatar.png',
      },
      client,
    )

    expect(updateCustomerProfile).toHaveBeenCalledWith({
      nickname: 'Grace',
      avatarUrl: 'https://example.com/avatar.png',
    })
    expect(JSON.stringify(updateCustomerProfile.mock.calls)).not.toContain('customerId')
    expect(JSON.stringify(updateCustomerProfile.mock.calls)).not.toContain('openid')
    expect(view.nickname).toBe('Grace')
  })

  it('fails fast when the profile update action is unavailable', async () => {
    await expect(saveCloudBaseCustomerProfile({ nickname: 'Grace' }, {} as CloudBaseMallApiClient))
      .rejects.toThrow('Customer profile update action is unavailable')
  })
})
