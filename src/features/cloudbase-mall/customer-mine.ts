import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import {
  createCustomerMineFailureView,
  createCustomerMineView,
  type CustomerMineView,
} from '../customer-mine/customer-mine'

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClient =>
  client ?? getRuntimeCloudBaseMallApiClient()

export const getCloudBaseCustomerMineView = async (
  client?: CloudBaseMallApiClient,
): Promise<CustomerMineView> => {
  try {
    const loadSnapshot = getClient(client).getCustomerMineSnapshot
    if (!loadSnapshot) throw new Error('Customer mine snapshot action is unavailable')

    return createCustomerMineView(await loadSnapshot())
  } catch (error) {
    return createCustomerMineFailureView(error)
  }
}

export const loadCustomerMineSnapshot = getCloudBaseCustomerMineView

export const retryCustomerMineSnapshot = loadCustomerMineSnapshot

export const retryCloudBaseCustomerMineSnapshot = retryCustomerMineSnapshot
