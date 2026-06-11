import type { CustomerAddress, CustomerAddressBookSnapshot } from '../../services/cloudbase/mall-api-client'
import { formatCloudBaseFailureMessage } from '../../services/cloudbase/cloudbase-function-client'

export type CustomerAddressLoadingState = 'idle' | 'loading' | 'refreshing' | 'failed'

export type CustomerAddressViewItem = CustomerAddress & {
  recipientLine: string
  regionLine: string
  detailLine: string
  defaultLabel: string
}

export type CustomerAddressBookView = {
  customerId: string
  items: CustomerAddressViewItem[]
  defaultAddressId: string
  emptyMessage: string
  loadingState: CustomerAddressLoadingState
  failureMessage: string
  lastUpdatedAt: string
}

type CustomerAddressBookViewOptions = {
  loadingState?: CustomerAddressLoadingState
  failureMessage?: string
}

const EMPTY_MESSAGE = '暂无收货地址'
const FAILURE_MESSAGE = '地址簿暂时无法加载'

const createEmptySnapshot = (): CustomerAddressBookSnapshot => ({
  customerId: '',
  addresses: [],
  defaultAddressId: null,
  serverTime: '',
})

const toFailureMessage = (error: unknown): string =>
  formatCloudBaseFailureMessage(error, FAILURE_MESSAGE)

const toViewItem = (address: CustomerAddress): CustomerAddressViewItem => ({
  ...address,
  recipientLine: `${address.contactName} ${address.phoneNumber}`,
  regionLine: [address.province, address.city, address.district].filter(Boolean).join(' '),
  detailLine: address.detail,
  defaultLabel: address.isDefault ? '默认' : '',
})

export const createCustomerAddressBookView = (
  snapshot: CustomerAddressBookSnapshot,
  options: CustomerAddressBookViewOptions = {},
): CustomerAddressBookView => {
  const items = snapshot.addresses.map(toViewItem)

  return {
    customerId: snapshot.customerId,
    items,
    defaultAddressId: snapshot.defaultAddressId ?? '',
    emptyMessage: items.length === 0 ? EMPTY_MESSAGE : '',
    loadingState: options.loadingState ?? 'idle',
    failureMessage: options.failureMessage ?? '',
    lastUpdatedAt: snapshot.serverTime,
  }
}

export const createCustomerAddressBookLoadingView = (
  previousView?: CustomerAddressBookView,
): CustomerAddressBookView => {
  if (previousView) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return createCustomerAddressBookView(createEmptySnapshot(), {
    loadingState: 'loading',
  })
}

export const createCustomerAddressBookFailureView = (
  error: unknown,
  previousView?: CustomerAddressBookView,
): CustomerAddressBookView => {
  const failureMessage = toFailureMessage(error)

  if (previousView) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage,
    }
  }

  return createCustomerAddressBookView(createEmptySnapshot(), {
    loadingState: 'failed',
    failureMessage,
  })
}
