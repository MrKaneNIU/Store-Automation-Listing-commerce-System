import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import {
  createCustomerOrderDetailFailureView,
  createCustomerOrderDetailPageView,
  createCustomerOrdersFailureView,
  createCustomerOrdersView,
  type CustomerOrderDetailPageView,
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

export const getCloudBaseCustomerOrderDetailView = async (
  orderId: string,
  client?: CloudBaseMallApiClient,
): Promise<CustomerOrderDetailPageView> => {
  try {
    const result = await getClient(client).getCustomerOrder(orderId)

    return createCustomerOrderDetailPageView(result.order)
  } catch (error) {
    return createCustomerOrderDetailFailureView(error)
  }
}
