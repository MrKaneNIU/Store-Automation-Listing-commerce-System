import { describe, expect, it, vi } from 'vitest'

import {
  createCustomerProfileView,
  type CustomerProfileView,
} from '../../../features/customer-profile/customer-profile'
import type { CustomerProfileSnapshot } from '../../../services/cloudbase/mall-api-client'
import { createCustomerProfilePageState } from './useCustomerProfilePageState'

const createSnapshot = (nickname = 'Ada'): CustomerProfileSnapshot => ({
  customerId: 'customer-1',
  profile: {
    customerId: 'customer-1',
    nickname,
    avatarUrl: 'cloud://avatar.png',
  },
  serverTime: '2026-06-11T00:00:00.000Z',
})

describe('customer profile page state', () => {
  it('loads profile through the injected page-facing facade', async () => {
    const loadView = vi.fn(async (): Promise<CustomerProfileView> =>
      createCustomerProfileView(createSnapshot('Ada')),
    )
    const saveProfile = vi.fn()
    const state = createCustomerProfilePageState({ loadView, saveProfile })

    await state.handlePageShow()

    expect(loadView).toHaveBeenCalledTimes(1)
    expect(state.nickname.value).toBe('Ada')
    expect(state.avatarUrl.value).toBe('cloud://avatar.png')
    expect(Object.keys(state)).not.toEqual(expect.arrayContaining(['customerId', 'openid']))
  })

  it('validates fields and saves without client identity authority', async () => {
    const savedView = createCustomerProfileView(createSnapshot('Grace'))
    const saveProfile = vi.fn(async () => savedView)
    const state = createCustomerProfilePageState({
      loadView: vi.fn(async () => createCustomerProfileView(createSnapshot('Ada'))),
      saveProfile,
    })

    await state.handlePageShow()
    state.updateNickname('Grace')
    state.updateAvatarUrl('https://example.com/avatar.png')
    await state.save()

    expect(saveProfile).toHaveBeenCalledWith({
      nickname: 'Grace',
      avatarUrl: 'https://example.com/avatar.png',
    })
    expect(JSON.stringify(saveProfile.mock.calls)).not.toContain('customerId')
    expect(JSON.stringify(saveProfile.mock.calls)).not.toContain('openid')
    expect(state.message.value).toBe('个人信息已保存')
    expect(state.isSaving.value).toBe(false)
  })

  it('keeps field-local errors and surfaces save failures for retry', async () => {
    const state = createCustomerProfilePageState({
      loadView: vi.fn(async () => createCustomerProfileView(createSnapshot('Ada'))),
      saveProfile: vi.fn(async () => {
        throw new Error('profile unavailable')
      }),
    })

    await state.handlePageShow()
    state.updateNickname('')
    await state.save()

    expect(state.fieldErrors.value.nickname).toBe('请输入昵称')
    expect(state.message.value).toBe('请先修正表单内容')

    state.updateNickname('Ada')
    await state.save()

    expect(state.viewModel.value.loadingState).toBe('failed')
    expect(state.message.value).toBe('profile unavailable')
    expect(state.isSaving.value).toBe(false)
  })
})
