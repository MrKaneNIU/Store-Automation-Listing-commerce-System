import type {
  CloudBaseMallApiClient,
  CustomerShoppingBagSnapshot,
} from '../../services/cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import {
  createCustomerShoppingBagFailureView,
  createCustomerShoppingBagView,
  type CustomerShoppingBagViewModel,
} from '../customer-shopping-bag/customer-shopping-bag'

export type CloudBaseCustomerShoppingBagCommandResult = {
  status: 'succeeded' | 'failed'
  message: string
  invalidatedSnapshotKeys: string[]
  view: CustomerShoppingBagViewModel
}

type ShoppingBagCommandOptions = {
  successMessage: string
  previousView?: CustomerShoppingBagViewModel
  command: () => Promise<CustomerShoppingBagSnapshotCommandResult>
}

type CustomerShoppingBagAddInput = Parameters<CloudBaseMallApiClient['addCustomerShoppingBagItem']>[0]
type CustomerShoppingBagQuantityInput = Parameters<CloudBaseMallApiClient['updateCustomerShoppingBagItemQuantity']>[1]
type CustomerShoppingBagSelectionInput = Parameters<CloudBaseMallApiClient['selectCustomerShoppingBagItem']>[1]

type CustomerShoppingBagSnapshotCommandResult = {
  snapshot: CustomerShoppingBagSnapshot
  invalidatedSnapshotKeys: string[]
}

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClient =>
  client ?? getRuntimeCloudBaseMallApiClient()

const runShoppingBagCommand = async ({
  successMessage,
  previousView,
  command,
}: ShoppingBagCommandOptions): Promise<CloudBaseCustomerShoppingBagCommandResult> => {
  try {
    const result = await command()

    return {
      status: 'succeeded',
      message: successMessage,
      invalidatedSnapshotKeys: result.invalidatedSnapshotKeys,
      view: createCustomerShoppingBagView(result.snapshot),
    }
  } catch (error) {
    const view = createCustomerShoppingBagFailureView(error, previousView)

    return {
      status: 'failed',
      message: view.failureMessage,
      invalidatedSnapshotKeys: [],
      view,
    }
  }
}

export const getCloudBaseCustomerShoppingBagView = async (
  client?: CloudBaseMallApiClient,
): Promise<CustomerShoppingBagViewModel> => {
  try {
    const snapshot = await getClient(client).getCustomerShoppingBagSnapshot()

    return createCustomerShoppingBagView(snapshot)
  } catch (error) {
    return createCustomerShoppingBagFailureView(error)
  }
}

export const addCloudBaseCustomerShoppingBagItem = async (
  input: CustomerShoppingBagAddInput,
  client?: CloudBaseMallApiClient,
  previousView?: CustomerShoppingBagViewModel,
): Promise<CloudBaseCustomerShoppingBagCommandResult> =>
  runShoppingBagCommand({
    successMessage: 'Added to shopping bag',
    previousView,
    command: () => getClient(client).addCustomerShoppingBagItem(input),
  })

export const updateCloudBaseCustomerShoppingBagItemQuantity = async (
  itemId: string,
  input: CustomerShoppingBagQuantityInput | number,
  client?: CloudBaseMallApiClient,
  previousView?: CustomerShoppingBagViewModel,
): Promise<CloudBaseCustomerShoppingBagCommandResult> => {
  const quantityInput = typeof input === 'number' ? { quantity: input } : input

  return runShoppingBagCommand({
    successMessage: 'Quantity updated',
    previousView,
    command: () => getClient(client).updateCustomerShoppingBagItemQuantity(itemId, quantityInput),
  })
}

export const selectCloudBaseCustomerShoppingBagItem = async (
  itemId: string,
  input: CustomerShoppingBagSelectionInput | boolean,
  client?: CloudBaseMallApiClient,
  previousView?: CustomerShoppingBagViewModel,
): Promise<CloudBaseCustomerShoppingBagCommandResult> => {
  const selectionInput = typeof input === 'boolean' ? { isSelected: input } : input

  return runShoppingBagCommand({
    successMessage: 'Selection updated',
    previousView,
    command: () => getClient(client).selectCustomerShoppingBagItem(itemId, selectionInput),
  })
}

export const removeCloudBaseCustomerShoppingBagItem = async (
  itemId: string,
  client?: CloudBaseMallApiClient,
  previousView?: CustomerShoppingBagViewModel,
): Promise<CloudBaseCustomerShoppingBagCommandResult> =>
  runShoppingBagCommand({
    successMessage: 'Removed from shopping bag',
    previousView,
    command: () => getClient(client).removeCustomerShoppingBagItem(itemId),
  })

export const clearUnavailableCloudBaseCustomerShoppingBagItems = async (
  client?: CloudBaseMallApiClient,
  previousView?: CustomerShoppingBagViewModel,
): Promise<CloudBaseCustomerShoppingBagCommandResult> =>
  runShoppingBagCommand({
    successMessage: 'Unavailable items cleared',
    previousView,
    command: () => getClient(client).clearUnavailableCustomerShoppingBagItems(),
  })
