import type {
  CustomerWalletLedgerEntry,
  CustomerWalletSnapshot,
} from '../../services/cloudbase/mall-api-client'
import { formatCloudBaseFailureMessage } from '../../services/cloudbase/cloudbase-function-client'

export type CustomerWalletLoadingState = 'idle' | 'loading' | 'refreshing' | 'failed'

export type CustomerWalletLedgerViewItem = CustomerWalletLedgerEntry & {
  amountText: string
  balanceAfterText: string
  directionLabel: string
  reasonLabel: string
  createdAtLabel: string
}

export type CustomerWalletView = {
  customerId: string
  balance: number
  balanceText: string
  ledger: CustomerWalletLedgerViewItem[]
  emptyMessage: string
  loadingState: CustomerWalletLoadingState
  failureMessage: string
  lastUpdatedAt: string
}

type CustomerWalletViewOptions = {
  loadingState?: CustomerWalletLoadingState
  failureMessage?: string
}

const EMPTY_MESSAGE = '暂无钱包流水'
const FAILURE_MESSAGE = '钱包暂时无法加载'

const createEmptySnapshot = (): CustomerWalletSnapshot => ({
  customerId: '',
  balance: 0,
  ledger: [],
  serverTime: '',
})

const formatMoney = (value: number): string => `¥ ${value.toFixed(2)}`

const formatLedgerTime = (value: string): string => {
  if (!value) return ''

  return value.replace('T', ' ').slice(0, 16)
}

const toFailureMessage = (error: unknown): string =>
  formatCloudBaseFailureMessage(error, FAILURE_MESSAGE)

const toLedgerItem = (entry: CustomerWalletLedgerEntry): CustomerWalletLedgerViewItem => {
  const sign = entry.direction === 'credit' ? '+' : '-'

  return {
    ...entry,
    amountText: `${sign}${formatMoney(Math.abs(entry.amount))}`,
    balanceAfterText: `余额 ${formatMoney(entry.balanceAfter)}`,
    directionLabel: entry.direction === 'credit' ? '收入' : '支出',
    reasonLabel: entry.reason || '钱包变动',
    createdAtLabel: formatLedgerTime(entry.createdAt),
  }
}

export const createCustomerWalletView = (
  snapshot: CustomerWalletSnapshot,
  options: CustomerWalletViewOptions = {},
): CustomerWalletView => {
  const ledger = snapshot.ledger.map(toLedgerItem)

  return {
    customerId: snapshot.customerId,
    balance: snapshot.balance,
    balanceText: formatMoney(snapshot.balance),
    ledger,
    emptyMessage: ledger.length === 0 ? EMPTY_MESSAGE : '',
    loadingState: options.loadingState ?? 'idle',
    failureMessage: options.failureMessage ?? '',
    lastUpdatedAt: snapshot.serverTime,
  }
}

export const createCustomerWalletLoadingView = (
  previousView?: CustomerWalletView,
): CustomerWalletView => {
  if (previousView) {
    return {
      ...previousView,
      loadingState: 'refreshing',
      failureMessage: '',
    }
  }

  return createCustomerWalletView(createEmptySnapshot(), {
    loadingState: 'loading',
  })
}

export const createCustomerWalletFailureView = (
  error: unknown,
  previousView?: CustomerWalletView,
): CustomerWalletView => {
  const failureMessage = toFailureMessage(error)

  if (previousView) {
    return {
      ...previousView,
      loadingState: 'failed',
      failureMessage,
    }
  }

  return createCustomerWalletView(createEmptySnapshot(), {
    loadingState: 'failed',
    failureMessage,
  })
}
