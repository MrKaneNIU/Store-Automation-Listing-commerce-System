import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import {
  createCustomerWalletFailureView,
  createCustomerWalletView,
  type CustomerWalletView,
} from '../customer-wallet/customer-wallet'

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClient =>
  client ?? getRuntimeCloudBaseMallApiClient()

export const getCloudBaseCustomerWalletView = async (
  client?: CloudBaseMallApiClient,
): Promise<CustomerWalletView> => {
  try {
    const loadSnapshot = getClient(client).getCustomerWalletSnapshot
    if (typeof loadSnapshot !== 'function') throw new Error('Customer wallet action is unavailable')

    return createCustomerWalletView(await loadSnapshot())
  } catch (error) {
    return createCustomerWalletFailureView(error)
  }
}

export const loadCustomerWalletSnapshot = getCloudBaseCustomerWalletView
