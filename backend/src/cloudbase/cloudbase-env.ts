import { BackendConfigurationError } from '../http/errors'

export type CloudBaseBillingMode = 'free-quota' | 'billing-enabled'

export type CloudBaseEnv = {
  envId: string
  region: string
  billingMode: CloudBaseBillingMode
}

const billingModes: CloudBaseBillingMode[] = ['free-quota', 'billing-enabled']

const parseBillingMode = (value: string | undefined): CloudBaseBillingMode => {
  const billingMode = value ?? 'free-quota'
  if (!billingModes.includes(billingMode as CloudBaseBillingMode)) {
    throw new BackendConfigurationError('CLOUDBASE_BILLING_MODE must be free-quota or billing-enabled')
  }

  return billingMode as CloudBaseBillingMode
}

export const parseCloudBaseEnv = (input: NodeJS.ProcessEnv): CloudBaseEnv => {
  const envId = input.CLOUDBASE_ENV_ID?.trim()
  if (!envId) {
    throw new BackendConfigurationError('CLOUDBASE_ENV_ID is required')
  }

  return {
    envId,
    region: input.CLOUDBASE_REGION?.trim() || 'ap-shanghai',
    billingMode: parseBillingMode(input.CLOUDBASE_BILLING_MODE),
  }
}
