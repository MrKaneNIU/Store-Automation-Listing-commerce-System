import type {
  CloudBaseMallApiClient,
  CustomerAddressBookSnapshot,
  CustomerAddressInput,
} from '../../services/cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import {
  createCustomerAddressBookFailureView,
  createCustomerAddressBookView,
  type CustomerAddressBookView,
} from '../customer-address/customer-address'

export type CustomerAddressSaveInput = CustomerAddressInput
export type CustomerAddressPatchInput = Partial<CustomerAddressInput>

type CustomerAddressCommandSnapshotResult = {
  snapshot: CustomerAddressBookSnapshot
  invalidatedSnapshotKeys: string[]
}

export type CloudBaseCustomerAddressCommandResult = {
  status: 'succeeded' | 'failed'
  message: string
  invalidatedSnapshotKeys: string[]
  view: CustomerAddressBookView
}

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClient =>
  client ?? getRuntimeCloudBaseMallApiClient()

const runAddressCommand = async (
  previousView: CustomerAddressBookView,
  successMessage: string,
  command: () => Promise<CustomerAddressCommandSnapshotResult>,
): Promise<CloudBaseCustomerAddressCommandResult> => {
  try {
    const result = await command()

    return {
      status: 'succeeded',
      message: successMessage,
      invalidatedSnapshotKeys: result.invalidatedSnapshotKeys,
      view: createCustomerAddressBookView(result.snapshot),
    }
  } catch (error) {
    const view = createCustomerAddressBookFailureView(error, previousView)

    return {
      status: 'failed',
      message: view.failureMessage,
      invalidatedSnapshotKeys: [],
      view,
    }
  }
}

export const getCloudBaseCustomerAddressBookView = async (
  client?: CloudBaseMallApiClient,
): Promise<CustomerAddressBookView> => {
  try {
    const loadSnapshot = getClient(client).getCustomerAddressBookSnapshot
    if (typeof loadSnapshot !== 'function') throw new Error('Customer address action is unavailable')

    return createCustomerAddressBookView(await loadSnapshot())
  } catch (error) {
    return createCustomerAddressBookFailureView(error)
  }
}

export const createCloudBaseCustomerAddress = (
  input: CustomerAddressSaveInput,
  previousView: CustomerAddressBookView,
  client?: CloudBaseMallApiClient,
): Promise<CloudBaseCustomerAddressCommandResult> =>
  runAddressCommand(previousView, '地址已保存', () => {
    const createAddress = getClient(client).createCustomerAddress
    if (typeof createAddress !== 'function') throw new Error('Customer address create action is unavailable')

    return createAddress(input)
  })

export const updateCloudBaseCustomerAddress = (
  addressId: string,
  input: CustomerAddressPatchInput,
  previousView: CustomerAddressBookView,
  client?: CloudBaseMallApiClient,
): Promise<CloudBaseCustomerAddressCommandResult> =>
  runAddressCommand(previousView, '地址已更新', () => {
    const updateAddress = getClient(client).updateCustomerAddress
    if (typeof updateAddress !== 'function') throw new Error('Customer address update action is unavailable')

    return updateAddress(addressId, input)
  })

export const deleteCloudBaseCustomerAddress = (
  addressId: string,
  previousView: CustomerAddressBookView,
  client?: CloudBaseMallApiClient,
): Promise<CloudBaseCustomerAddressCommandResult> =>
  runAddressCommand(previousView, '地址已删除', () => {
    const deleteAddress = getClient(client).deleteCustomerAddress
    if (typeof deleteAddress !== 'function') throw new Error('Customer address delete action is unavailable')

    return deleteAddress(addressId)
  })

export const setDefaultCloudBaseCustomerAddress = (
  addressId: string,
  previousView: CustomerAddressBookView,
  client?: CloudBaseMallApiClient,
): Promise<CloudBaseCustomerAddressCommandResult> =>
  runAddressCommand(previousView, '默认地址已更新', () => {
    const setDefaultAddress = getClient(client).setDefaultCustomerAddress
    if (typeof setDefaultAddress !== 'function') throw new Error('Customer address default action is unavailable')

    return setDefaultAddress(addressId)
  })
