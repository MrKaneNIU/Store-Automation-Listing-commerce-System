import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import {
  createCustomerOrdersFailureView,
  createCustomerOrdersView,
  type CustomerOrdersView,
} from '../customer-orders/customer-orders'

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClient =>
  client ?? getRuntimeCloudBaseMallApiClient()

export const getCloudBaseCustomerOrdersView = async (
  client?: CloudBaseMallApiClient,
): Promise<CustomerOrdersView> => {
  try {
    const snapshot = await getClient(client).getCustomerOrdersSnapshot()

    return createCustomerOrdersView(snapshot)
  } catch (error) {
    return createCustomerOrdersFailureView(error)
  }
}
