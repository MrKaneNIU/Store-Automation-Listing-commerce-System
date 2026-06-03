import { routes, type AppRoute } from '../../app/routes'
import {
  clearAdminWorkbenchSessionSnapshot,
  getAdminWorkbenchToken,
} from '../../services/auth/admin-workbench-session'

export const getAdminWorkbenchEntryRoute = (): AppRoute => {
  return getAdminWorkbenchToken() ? routes.ownerDashboard : routes.adminLogin
}

export const resetAdminWorkbenchSessionOnLaunch = (): void => {
  clearAdminWorkbenchSessionSnapshot()
}
