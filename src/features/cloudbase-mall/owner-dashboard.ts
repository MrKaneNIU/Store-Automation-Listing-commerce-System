import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'

const MAX_UPLOAD_COUNT = 18
const SELECTED_SCREENSHOT_COUNT = 5

export type OwnerDashboardViewModel = {
  remainingUploadCount: number
  pendingDraftCount: number
  pendingImageTaskCount: number
  pendingOrderCount: number
}

export const createEmptyOwnerDashboardView = (): OwnerDashboardViewModel => ({
  remainingUploadCount: Math.max(0, MAX_UPLOAD_COUNT - SELECTED_SCREENSHOT_COUNT),
  pendingDraftCount: 0,
  pendingImageTaskCount: 0,
  pendingOrderCount: 0,
})

export const getCloudBaseOwnerDashboardView = async (
  client: CloudBaseMallApiClient = getRuntimeCloudBaseMallApiClient(),
): Promise<OwnerDashboardViewModel> => {
  const snapshot = await client.getOwnerDashboardSnapshot()

  return {
    remainingUploadCount: Math.max(0, MAX_UPLOAD_COUNT - SELECTED_SCREENSHOT_COUNT),
    pendingDraftCount: snapshot.pendingDraftCount,
    pendingImageTaskCount: snapshot.pendingImageTaskCount,
    pendingOrderCount: snapshot.pendingOrderCount,
  }
}
