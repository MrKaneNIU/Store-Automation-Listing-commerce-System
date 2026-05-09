import { createSuccessEnvelope } from '../http/response'
import { phase2CloudBaseCollections } from './cloudbase-data-model'
import type { CloudBaseEnv } from './cloudbase-env'

export const createCloudBaseHealthEnvelope = (env: CloudBaseEnv) =>
  createSuccessEnvelope({
    service: 'cloudbase',
    envId: env.envId,
    region: env.region,
    billingMode: env.billingMode,
    requiredCollections: phase2CloudBaseCollections.length,
  })
