import type {
  CloudBaseMallApiClient,
  CustomerFavoriteProductsSnapshot,
} from '../../services/cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import {
  createCustomerFavoriteProductsFailureView,
  createCustomerFavoriteProductsView,
  type CustomerFavoriteProductCommandResult,
  type CustomerFavoriteProductsView,
} from '../customer-favorites/customer-favorites'

type CustomerFavoriteSnapshotCommandResult = {
  snapshot: CustomerFavoriteProductsSnapshot
  invalidatedSnapshotKeys: string[]
}

type FavoriteCommandOptions = {
  successMessage: string
  previousView?: CustomerFavoriteProductsView
  command: () => Promise<CustomerFavoriteSnapshotCommandResult>
}

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClient =>
  client ?? getRuntimeCloudBaseMallApiClient()

const runFavoriteCommand = async ({
  successMessage,
  previousView,
  command,
}: FavoriteCommandOptions): Promise<CustomerFavoriteProductCommandResult> => {
  try {
    const result = await command()

    return {
      status: 'succeeded',
      message: successMessage,
      invalidatedSnapshotKeys: result.invalidatedSnapshotKeys,
      view: createCustomerFavoriteProductsView(result.snapshot),
    }
  } catch (error) {
    const view = createCustomerFavoriteProductsFailureView(error, previousView)

    return {
      status: 'failed',
      message: view.failureMessage,
      invalidatedSnapshotKeys: [],
      view,
    }
  }
}

export const getCloudBaseCustomerFavoriteProductsView = async (
  client?: CloudBaseMallApiClient,
): Promise<CustomerFavoriteProductsView> => {
  try {
    const snapshot = await getClient(client).getCustomerFavoriteProductsSnapshot()

    return createCustomerFavoriteProductsView(snapshot)
  } catch (error) {
    return createCustomerFavoriteProductsFailureView(error)
  }
}

export const favoriteCloudBaseCustomerProduct = async (
  productId: string,
  client?: CloudBaseMallApiClient,
  previousView?: CustomerFavoriteProductsView,
): Promise<CustomerFavoriteProductCommandResult> =>
  runFavoriteCommand({
    successMessage: 'Favorite saved',
    previousView,
    command: () => getClient(client).favoriteCustomerProduct(productId),
  })

export const unfavoriteCloudBaseCustomerProduct = async (
  productId: string,
  client?: CloudBaseMallApiClient,
  previousView?: CustomerFavoriteProductsView,
): Promise<CustomerFavoriteProductCommandResult> =>
  runFavoriteCommand({
    successMessage: 'Favorite removed',
    previousView,
    command: () => getClient(client).unfavoriteCustomerProduct(productId),
  })

export const removeCloudBaseCustomerFavoriteProduct = async (
  productId: string,
  client?: CloudBaseMallApiClient,
  previousView?: CustomerFavoriteProductsView,
): Promise<CustomerFavoriteProductCommandResult> =>
  runFavoriteCommand({
    successMessage: 'Favorite removed',
    previousView,
    command: () => getClient(client).removeCustomerFavoriteProduct(productId),
  })

export const retryCloudBaseCustomerFavoriteProductsSnapshot = getCloudBaseCustomerFavoriteProductsView
