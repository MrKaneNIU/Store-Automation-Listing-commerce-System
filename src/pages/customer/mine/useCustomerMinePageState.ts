import { loadCustomerMineSnapshot } from '../../../features/cloudbase-mall/customer-mine'
import { createCustomerMinePageState } from '../../../features/customer-mine/customer-mine-page-state'
import type { CustomerMineView } from '../../../features/customer-mine/customer-mine'

type CustomerMinePageStateOptions = {
  loadView?: () => Promise<CustomerMineView>
}

export const useCustomerMinePageState = (options: CustomerMinePageStateOptions = {}) =>
  createCustomerMinePageState({
    loadView: options.loadView ?? loadCustomerMineSnapshot,
  })
