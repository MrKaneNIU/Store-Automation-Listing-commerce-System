import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import {
  createCustomerProfileFailureView,
  createCustomerProfileView,
  type CustomerProfileView,
} from '../customer-profile/customer-profile'

export type CustomerProfileSaveInput = {
  nickname: string
  avatarUrl?: string
}

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClient =>
  client ?? getRuntimeCloudBaseMallApiClient()

export const getCloudBaseCustomerProfileView = async (
  client?: CloudBaseMallApiClient,
): Promise<CustomerProfileView> => {
  try {
    const loadSnapshot = getClient(client).getCustomerProfileSnapshot
    if (!loadSnapshot) throw new Error('Customer profile action is unavailable')

    return createCustomerProfileView(await loadSnapshot())
  } catch (error) {
    return createCustomerProfileFailureView(error)
  }
}

export const saveCloudBaseCustomerProfile = async (
  input: CustomerProfileSaveInput,
  client?: CloudBaseMallApiClient,
): Promise<CustomerProfileView> => {
  const saveProfile = getClient(client).updateCustomerProfile
  if (!saveProfile) throw new Error('Customer profile update action is unavailable')

  return createCustomerProfileView(await saveProfile(input))
}

export const loadCustomerProfileSnapshot = getCloudBaseCustomerProfileView
