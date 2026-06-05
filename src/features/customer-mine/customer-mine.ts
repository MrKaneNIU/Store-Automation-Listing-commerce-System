import type {
  CustomerMineRecentOrderSummary,
  CustomerMineSnapshot,
  CustomerMineUtilityEntry,
} from '../../services/cloudbase/mall-api-client'
import { formatCloudBaseFailureMessage } from '../../services/cloudbase/cloudbase-function-client'

export type CustomerMineLoadingState = 'idle' | 'loading' | 'refreshing' | 'failed'

export type CustomerMineRecentOrderView = CustomerMineRecentOrderSummary & {
  totalAmountText: string
  itemCountLabel: string
}

export type CustomerMineUtilityView = CustomerMineUtilityEntry & {
  countLabel: string
}

export type CustomerMineView = {
  customerId: string
  identityLabel: string
  identityDisplayName: string
  identityOpenidLabel: string
  avatarUrl: string
  hasAvatar: boolean
  avatarPlaceholderText: string
  phoneLabel: string
  phoneDisplayText: string
  recentOrders: CustomerMineRecentOrderView[]
  recentOrderTotalCount: number
  recentOrdersEmptyMessage: string
  utilities: CustomerMineUtilityView[]
  emptyMessage: string
  loadingState: CustomerMineLoadingState
  failureMessage: string
  lastUpdatedAt: string
}

type CustomerMineViewOptions = {
  loadingState?: CustomerMineLoadingState
  failureMessage?: string
}

const EMPTY_MESSAGE = '暂无我的数据'
const LOADING_MESSAGE = '正在加载我的'
const RECENT_ORDERS_EMPTY_MESSAGE = '暂无近期订单'
const FAILURE_MESSAGE = '我的暂时无法加载'
const AVATAR_PLACEHOLDER_TEXT = '微'

const createEmptySnapshot = (): CustomerMineSnapshot => ({
  customerId: '',
  identity: {
    isSignedIn: false,
    displayName: '',
    authSource: 'wechat',
    openidMasked: '',
  },
  phone: {
    isBound: false,
    maskedPhoneNumber: '',
    statusLabel: 'Phone not bound',
  },
  profile: {
    avatarUrl: '',
  },
  recentOrders: [],
  recentOrderTotalCount: 0,
  utilities: [
    {
      key: 'favorites',
      label: '收藏',
      route: '/pages/customer/favorites/index',
      count: 0,
      isEnabled: true,
    },
    {
      key: 'shoppingBag',
      label: '购物袋',
      route: '/pages/customer/shopping-bag/index',
      count: 0,
      isEnabled: true,
    },
  ],
  serverTime: '',
})

const orderStatusLabelMap: Record<CustomerMineRecentOrderSummary['status'], string> = {
  pending_merchant_confirm: '待商家确认',
  confirmed: '已确认',
  canceled: '已取消',
}

const utilityLabelMap: Record<CustomerMineUtilityEntry['key'], string> = {
  profile: '个人信息',
  wallet: '钱包',
  address: '地址',
  orders: '我的订单',
  favorites: '收藏',
  shoppingBag: '购物袋',
}

const accountUtilityEntries: CustomerMineUtilityEntry[] = [
  {
    key: 'profile',
    label: 'Personal information',
    route: '/pages/customer/profile/index',
    count: 0,
    isEnabled: true,
  },
  {
    key: 'wallet',
    label: 'Wallet',
    route: '/pages/customer/wallet/index',
    count: 0,
    isEnabled: true,
  },
  {
    key: 'address',
    label: 'Address',
    route: '/pages/customer/address/index',
    count: 0,
    isEnabled: true,
  },
  {
    key: 'orders',
    label: 'My orders',
    route: '/pages/customer/orders/index',
    count: 0,
    isEnabled: true,
  },
]

const normalizePhoneStatusLabel = (label: string): string => {
  if (label === 'Phone bound') return '已绑定手机'
  if (label === 'Phone not bound') return '未绑定手机'
  return label
}

const formatMoney = (value: number): string => `¥ ${value.toFixed(2)}`

const formatItemCount = (value: number): string => `${value} 件商品`

const toFailureMessage = (error: unknown): string => {
  return formatCloudBaseFailureMessage(error, FAILURE_MESSAGE)
}

const toRecentOrderView = (order: CustomerMineRecentOrderSummary): CustomerMineRecentOrderView => ({
  ...order,
  statusLabel: orderStatusLabelMap[order.status] || order.statusLabel,
  totalAmountText: formatMoney(order.totalAmount),
  itemCountLabel: formatItemCount(order.itemCount),
})

const toUtilityView = (entry: CustomerMineUtilityEntry): CustomerMineUtilityView => ({
  ...entry,
  label: utilityLabelMap[entry.key],
  countLabel: entry.key === 'profile' || entry.key === 'orders'
    ? '查看'
    : entry.key === 'wallet' || entry.key === 'address'
    ? '空'
    : String(entry.count),
})

export const createCustomerMineView = (
  snapshot: CustomerMineSnapshot,
  options: CustomerMineViewOptions = {},
): CustomerMineView => {
  const recentOrders = snapshot.recentOrders.map(toRecentOrderView)
  const loadingState = options.loadingState ?? 'idle'
  const isFailure = loadingState === 'failed'
  const isLoading = loadingState === 'loading'
  const isSignedIn = snapshot.identity.isSignedIn
  const avatarUrl = (snapshot.profile?.avatarUrl ?? '').trim()

  return {
    customerId: snapshot.customerId,
    identityLabel: isFailure ? '身份待确认' : (isSignedIn ? '已登录' : '未登录'),
    identityDisplayName: isFailure
      ? '请重试验证微信身份'
      : isSignedIn
      ? snapshot.identity.displayName.trim() || '微信客户'
      : '登录后查看账户',
    identityOpenidLabel: snapshot.identity.openidMasked,
    avatarUrl,
    hasAvatar: avatarUrl.length > 0,
    avatarPlaceholderText: avatarUrl ? '' : AVATAR_PLACEHOLDER_TEXT,
    phoneLabel: isFailure ? '手机状态暂不可用' : normalizePhoneStatusLabel(snapshot.phone.statusLabel),
    phoneDisplayText: snapshot.phone.isBound ? snapshot.phone.maskedPhoneNumber : '未绑定',
    recentOrders,
    recentOrderTotalCount: snapshot.recentOrderTotalCount,
    recentOrdersEmptyMessage: recentOrders.length === 0 ? RECENT_ORDERS_EMPTY_MESSAGE : '',
    utilities: [...accountUtilityEntries, ...snapshot.utilities].map(toUtilityView),
    emptyMessage: isLoading ? LOADING_MESSAGE : (recentOrders.length === 0 && snapshot.utilities.length === 0 ? EMPTY_MESSAGE : ''),
    loadingState,
    failureMessage: options.failureMessage ?? '',
    lastUpdatedAt: snapshot.serverTime,
  }
}

export const createCustomerMineLoadingView = (
  previousView?: CustomerMineView,
): CustomerMineView => {
  if (previousView) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return createCustomerMineView(createEmptySnapshot(), {
    loadingState: 'loading',
  })
}

export const createCustomerMineFailureView = (
  error: unknown,
  previousView?: CustomerMineView,
): CustomerMineView => {
  const failureMessage = toFailureMessage(error)

  if (previousView) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage,
      phoneLabel: '手机状态暂不可用',
    }
  }

  return createCustomerMineView(createEmptySnapshot(), {
    loadingState: 'failed',
    failureMessage,
  })
}
