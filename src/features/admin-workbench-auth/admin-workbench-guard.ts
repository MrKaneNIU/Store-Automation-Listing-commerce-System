import { relaunchTo } from '../../app/navigation'
import { routes } from '../../app/routes'
import {
  getAdminWorkbenchSession,
  logoutAdminWorkbench,
} from '../../services/auth/admin-workbench-session'
import {
  getAdminPermissionView,
  hasAdminPermission,
  type AdminPermissionScope,
} from '../admin-permissions/admin-permissions'

const redirectToLogin = () => {
  relaunchTo(routes.adminLogin)
}

const showNoPermissionToast = () => {
  uni.showToast({
    title: '无权限访问该模块',
    icon: 'none',
    duration: 1600,
  })
}

const redirectToNoPermission = () => {
  relaunchTo(routes.ownerNoPermission)
}

export const ensureAdminWorkbenchSession = (requiredPermission?: AdminPermissionScope): boolean => {
  const session = getAdminWorkbenchSession()

  if (!session) {
    redirectToLogin()
    return false
  }

  if (!getAdminPermissionView(session.account).currentAccount) {
    logoutAdminWorkbench()
    redirectToLogin()
    return false
  }

  if (!requiredPermission || hasAdminPermission(session.account, requiredPermission)) {
    return true
  }

  showNoPermissionToast()
  redirectToNoPermission()
  return false
}
