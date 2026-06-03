import { relaunchTo } from '../../app/navigation'
import { routes } from '../../app/routes'
import {
  getAdminWorkbenchSession,
  getAdminWorkbenchToken,
  logoutAdminWorkbench,
  refreshAdminWorkbenchSessionSnapshot,
} from '../../services/auth/admin-workbench-session'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient, CloudBaseMallApiClientWithAdmin } from '../../services/cloudbase/mall-api-client'
import type { AdminPermissionScope } from '../admin-permissions/admin-permissions'

const redirectToLogin = () => {
  relaunchTo(routes.adminLogin)
}

const showNoPermissionToast = () => {
  if (typeof uni.showToast !== 'function') {
    return
  }

  uni.showToast({
    title: '无权限访问该模块',
    icon: 'none',
    duration: 1600,
  })
}

const redirectToNoPermission = () => {
  relaunchTo(routes.ownerNoPermission)
}

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClientWithAdmin =>
  (client ?? getRuntimeCloudBaseMallApiClient()) as CloudBaseMallApiClientWithAdmin

const sessionHasPermission = (requiredPermission?: AdminPermissionScope): boolean => {
  const session = getAdminWorkbenchSession()

  if (!session) {
    return false
  }
  return !requiredPermission || session.role === 'creator' || session.permissions.includes(requiredPermission)
}

export const ensureAdminWorkbenchSession = (requiredPermission?: AdminPermissionScope): boolean => {
  if (!getAdminWorkbenchToken()) {
    redirectToLogin()
    return false
  }

  if (sessionHasPermission(requiredPermission)) {
    return true
  }

  showNoPermissionToast()
  redirectToNoPermission()
  return false
}

export const ensureAdminWorkbenchSessionFromServer = async (
  requiredPermission?: AdminPermissionScope,
  client?: CloudBaseMallApiClient,
): Promise<boolean> => {
  if (!getAdminWorkbenchToken()) {
    redirectToLogin()
    return false
  }

  try {
    const session = await getClient(client).getAdminSession()
    refreshAdminWorkbenchSessionSnapshot(session)
  } catch {
    logoutAdminWorkbench()
    redirectToLogin()
    return false
  }

  if (sessionHasPermission(requiredPermission)) {
    return true
  }

  showNoPermissionToast()
  redirectToNoPermission()
  return false
}
