import { describe, expect, it } from 'vitest'

import type { CustomerMineSnapshot } from '../../services/cloudbase/mall-api-client'
import {
  createCustomerMineFailureView,
  createCustomerMineLoadingView,
  createCustomerMineView,
} from './customer-mine'

const createSnapshot = (overrides: Partial<CustomerMineSnapshot> = {}): CustomerMineSnapshot => ({
  customerId: 'customer-1',
  identity: {
    isSignedIn: true,
    displayName: '138****0000',
    authSource: 'wechat',
    openidMasked: 'cust...enid',
  },
  phone: {
    isBound: true,
    maskedPhoneNumber: '138****0000',
    statusLabel: 'Phone bound',
  },
  profile: {
    avatarUrl: '',
  },
  recentOrders: [
    {
      orderId: 'order-1',
      status: 'pending_merchant_confirm',
      statusLabel: 'Pending merchant confirmation',
      totalAmount: 129,
      itemCount: 2,
      primaryProductName: 'Cotton Shirt',
      createdAt: '2026-05-31T00:00:00.000Z',
      updatedAt: '2026-05-31T00:00:00.000Z',
    },
  ],
  recentOrderTotalCount: 1,
  utilities: [
    {
      key: 'favorites',
      label: 'Favorites',
      route: '/pages/customer/favorites/index',
      count: 3,
      isEnabled: true,
    },
    {
      key: 'shoppingBag',
      label: 'Shopping bag',
      route: '/pages/customer/shopping-bag/index',
      count: 4,
      isEnabled: true,
    },
  ],
  serverTime: '2026-05-31T00:00:00.000Z',
  ...overrides,
})

describe('customer mine ViewModel', () => {
  it('maps signed-in identity labels with fallback display text', () => {
    const view = createCustomerMineView(createSnapshot({
      identity: {
        isSignedIn: true,
        displayName: '',
        authSource: 'wechat',
        openidMasked: 'cust...enid',
      },
    }))

    expect(view.identityLabel).toBe('已登录')
    expect(view.identityDisplayName).toBe('微信客户')
    expect(view.identityOpenidLabel).toBe('cust...enid')
  })

  it('maps persisted avatar profile state and stable placeholder text', () => {
    const withAvatar = createCustomerMineView(createSnapshot({
      profile: {
        avatarUrl: 'cloud://avatars/customer-1.png',
      },
    }))
    const withoutAvatar = createCustomerMineView(createSnapshot({
      profile: {
        avatarUrl: '',
      },
    }))

    expect(withAvatar.hasAvatar).toBe(true)
    expect(withAvatar.avatarUrl).toBe('cloud://avatars/customer-1.png')
    expect(withAvatar.avatarPlaceholderText).toBe('')
    expect(withoutAvatar.hasAvatar).toBe(false)
    expect(withoutAvatar.avatarUrl).toBe('')
    expect(withoutAvatar.avatarPlaceholderText).toBe('微')
  })

  it('maps unsigned identity labels', () => {
    const view = createCustomerMineView(createSnapshot({
      customerId: '',
      identity: {
        isSignedIn: false,
        displayName: '',
        authSource: 'wechat',
        openidMasked: '',
      },
    }))

    expect(view.identityLabel).toBe('未登录')
    expect(view.identityDisplayName).toBe('登录后查看账户')
  })

  it('maps phone bound and unbound labels', () => {
    const bound = createCustomerMineView(createSnapshot())
    const unbound = createCustomerMineView(createSnapshot({
      phone: {
        isBound: false,
        maskedPhoneNumber: '',
        statusLabel: 'Phone not bound',
      },
    }))

    expect(bound.phoneLabel).toBe('已绑定手机')
    expect(bound.phoneDisplayText).toBe('138****0000')
    expect(unbound.phoneLabel).toBe('未绑定手机')
    expect(unbound.phoneDisplayText).toBe('未绑定')
  })

  it('maps phone failed labels from the snapshot status', () => {
    const view = createCustomerMineView(createSnapshot({
      phone: {
        isBound: false,
        maskedPhoneNumber: '',
        statusLabel: 'Phone status failed',
      },
    }))

    expect(view.phoneLabel).toBe('Phone status failed')
    expect(view.phoneDisplayText).toBe('未绑定')
  })

  it('maps recent order empty state and summaries', () => {
    const empty = createCustomerMineView(createSnapshot({
      recentOrders: [],
      recentOrderTotalCount: 0,
    }))
    const populated = createCustomerMineView(createSnapshot())

    expect(empty.recentOrders).toEqual([])
    expect(empty.recentOrdersEmptyMessage).toBe('暂无近期订单')
    expect(populated.recentOrders[0]).toMatchObject({
      orderId: 'order-1',
      statusLabel: '待商家确认',
      totalAmountText: '¥ 129.00',
      itemCountLabel: '2 件商品',
      primaryProductName: 'Cotton Shirt',
    })
    expect(populated.recentOrdersEmptyMessage).toBe('')
  })

  it('maps favorites and shopping-bag utility routes', () => {
    const view = createCustomerMineView(createSnapshot())

    expect(view.utilities).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: 'profile',
        label: '个人信息',
        route: '/pages/customer/profile/index',
        countLabel: '查看',
      }),
      expect.objectContaining({
        key: 'wallet',
        label: '钱包',
        route: '/pages/customer/wallet/index',
        countLabel: '空',
      }),
      expect.objectContaining({
        key: 'address',
        label: '地址',
        route: '/pages/customer/address/index',
        countLabel: '空',
      }),
      expect.objectContaining({
        key: 'orders',
        label: '我的订单',
        route: '/pages/customer/orders/index',
        countLabel: '查看',
      }),
      expect.objectContaining({
        key: 'favorites',
        label: '收藏',
        route: '/pages/customer/favorites/index',
        countLabel: '3',
      }),
      expect.objectContaining({
        key: 'shoppingBag',
        label: '购物袋',
        route: '/pages/customer/shopping-bag/index',
        countLabel: '4',
      }),
    ]))
  })

  it('creates loading and failure states', () => {
    const loading = createCustomerMineLoadingView()
    const failed = createCustomerMineFailureView(new Error('network timeout'))

    expect(loading.loadingState).toBe('loading')
    expect(loading.emptyMessage).toBe('正在加载我的')
    expect(failed.loadingState).toBe('failed')
    expect(failed.failureMessage).toBe('network timeout')
    expect(failed.phoneLabel).toBe('手机状态暂不可用')
  })

  it('sanitizes raw CloudBase storage errors before rendering failure text', () => {
    const failed = createCustomerMineFailureView(
      new Error('DATABASE_COLLECTION_NOT_EXIST: Db or Table not exist. https://cloud.tencent.com/document/api/876/34822'),
    )

    expect(failed.failureMessage).toBe('系统数据初始化中，请稍后重试')
    expect(failed.phoneLabel).toBe('手机状态暂不可用')
  })

  it('sanitizes mp runtime module loader errors before rendering failure text', () => {
    const failed = createCustomerMineFailureView(
      new Error("module 'services/performance/url.js' is not defined, require args is 'url'"),
    )

    expect(failed.failureMessage).toBe('系统数据初始化中，请稍后重试')
    expect(failed.failureMessage).not.toContain('services/performance/url.js')
    expect(failed.failureMessage).not.toContain('require args')
    expect(failed.phoneLabel).toBe('手机状态暂不可用')
  })

  it('shows an auth failure identity state instead of a fake logged-out state', () => {
    const failed = createCustomerMineFailureView(new Error('Verified WeChat identity is required'))

    expect(failed.loadingState).toBe('failed')
    expect(failed.identityLabel).toBe('身份待确认')
    expect(failed.identityDisplayName).toBe('请重试验证微信身份')
  })
})
