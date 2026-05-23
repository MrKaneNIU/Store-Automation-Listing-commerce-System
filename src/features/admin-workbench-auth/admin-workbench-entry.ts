import { routes, type AppRoute } from '../../app/routes'
import {
  getAdminWorkbenchSession,
  logoutAdminWorkbench,
} from '../../services/auth/admin-workbench-session'

export const getAdminWorkbenchEntryRoute = (): AppRoute => {
  return getAdminWorkbenchSession() ? routes.ownerDashboard : routes.adminLogin
}

export const resetAdminWorkbenchSessionOnLaunch = (): void => {
  logoutAdminWorkbench()
}
