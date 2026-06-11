import type { Order, OrderItem, OrderStatus, ShippingAddressSnapshot } from '../../domain/order/types'
import type { CustomerOrdersSnapshot } from '../../services/cloudbase/mall-api-client'
import { formatCloudBaseFailureMessage } from '../../services/cloudbase/cloudbase-function-client'

export type CustomerOrdersLoadingState = 'idle' | 'loading' | 'refreshing' | 'failed'

export type CustomerOrderViewItem = Order & {
  statusLabel: string
  totalAmountText: string
  itemCountLabel: string
  primaryProductName: string
  createdAtLabel: string
  updatedAtLabel: string
}

export type CustomerOrderDetailItem = OrderItem & {
  unitPriceText: string
  lineTotalText: string
  quantityLabel: string
}

export type CustomerOrderDetailView = CustomerOrderViewItem & {
  detailItems: CustomerOrderDetailItem[]
  hasShippingAddress: boolean
  shippingContactLine: string
  shippingAddressLine: string
}

export type CustomerOrderDetailPageView = {
  order: CustomerOrderDetailView | null
  loadingState: CustomerOrdersLoadingState
  failureMessage: string
}

export type CustomerOrdersView = {
  items: CustomerOrderViewItem[]
  totalCount: number
  totalCountLabel: string
  emptyMessage: string
  loadingState: CustomerOrdersLoadingState
  failureMessage: string
  lastUpdatedAt: string
}

type CustomerOrdersViewOptions = {
  loadingState?: CustomerOrdersLoadingState
  failureMessage?: string
}

const EMPTY_MESSAGE = '暂无订单'
const FAILURE_MESSAGE = '订单暂时无法加载'
const LEGACY_ADDRESS_FALLBACK = '未记录收货地址'

const statusLabels: Record<OrderStatus, string> = {
  pending_merchant_confirm: '待商家确认',
  confirmed: '已确认',
  canceled: '已取消',
}

const createEmptySnapshot = (): CustomerOrdersSnapshot => ({
  customerId: '',
  orders: [],
  totalCount: 0,
  serverTime: '',
})

const formatMoney = (value: number): string => `¥ ${value.toFixed(2)}`

const formatDateTime = (value: string): string => {
  if (!value) return '未记录'

  return value.replace('T', ' ').slice(0, 16)
}

const formatTotalCount = (totalCount: number): string =>
  `${totalCount} 个订单`

const formatItemCount = (order: Order): string => {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return `${count} 件商品`
}

const toFailureMessage = (error: unknown): string =>
  formatCloudBaseFailureMessage(error, FAILURE_MESSAGE)

const toShippingContactLine = (shippingAddress?: ShippingAddressSnapshot): string => {
  if (!shippingAddress) return LEGACY_ADDRESS_FALLBACK

  return `${shippingAddress.contactName} ${shippingAddress.phoneNumber}`.trim()
}

const toShippingAddressLine = (shippingAddress?: ShippingAddressSnapshot): string => {
  if (!shippingAddress) return LEGACY_ADDRESS_FALLBACK

  return [
    shippingAddress.province,
    shippingAddress.city,
    shippingAddress.district,
    shippingAddress.detail,
  ].filter(Boolean).join(' ')
}

const toDetailItem = (item: OrderItem): CustomerOrderDetailItem => ({
  ...item,
  unitPriceText: formatMoney(item.salePrice),
  lineTotalText: formatMoney(item.salePrice * item.quantity),
  quantityLabel: `x ${item.quantity}`,
})

const toViewItem = (order: Order): CustomerOrderViewItem => ({
  ...order,
  statusLabel: statusLabels[order.status],
  totalAmountText: formatMoney(order.totalAmount),
  itemCountLabel: formatItemCount(order),
  primaryProductName: order.items[0]?.productName || '订单',
  createdAtLabel: formatDateTime(order.createdAt),
  updatedAtLabel: formatDateTime(order.updatedAt),
})

export const createCustomerOrderDetailView = (
  order: Order,
): CustomerOrderDetailView => ({
  ...toViewItem(order),
  detailItems: order.items.map(toDetailItem),
  hasShippingAddress: Boolean(order.shippingAddress),
  shippingContactLine: toShippingContactLine(order.shippingAddress),
  shippingAddressLine: toShippingAddressLine(order.shippingAddress),
})

export const createCustomerOrderDetailPageView = (
  order: Order,
  options: CustomerOrdersViewOptions = {},
): CustomerOrderDetailPageView => ({
  order: createCustomerOrderDetailView(order),
  loadingState: options.loadingState ?? 'idle',
  failureMessage: options.failureMessage ?? '',
})

export const createCustomerOrderDetailLoadingView = (
  previousView?: CustomerOrderDetailPageView,
): CustomerOrderDetailPageView => {
  if (previousView?.order) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return {
    order: null,
    loadingState: 'loading',
    failureMessage: '',
  }
}

export const createCustomerOrderDetailFailureView = (
  error: unknown,
  previousView?: CustomerOrderDetailPageView,
): CustomerOrderDetailPageView => ({
  order: previousView?.order ?? null,
  loadingState: 'failed',
  failureMessage: toFailureMessage(error),
})

export const createCustomerOrdersView = (
  snapshot: CustomerOrdersSnapshot,
  options: CustomerOrdersViewOptions = {},
): CustomerOrdersView => {
  const items = snapshot.orders.map(toViewItem)

  return {
    items,
    totalCount: snapshot.totalCount,
    totalCountLabel: formatTotalCount(snapshot.totalCount),
    emptyMessage: items.length === 0 ? EMPTY_MESSAGE : '',
    loadingState: options.loadingState ?? 'idle',
    failureMessage: options.failureMessage ?? '',
    lastUpdatedAt: snapshot.serverTime,
  }
}

export const createCustomerOrdersLoadingView = (
  previousView?: CustomerOrdersView,
): CustomerOrdersView => {
  if (previousView) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return createCustomerOrdersView(createEmptySnapshot(), {
    loadingState: 'loading',
  })
}

export const createCustomerOrdersFailureView = (
  error: unknown,
  previousView?: CustomerOrdersView,
): CustomerOrdersView => {
  const failureMessage = toFailureMessage(error)

  if (previousView) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage,
    }
  }

  return createCustomerOrdersView(createEmptySnapshot(), {
    loadingState: 'failed',
    failureMessage,
  })
}
