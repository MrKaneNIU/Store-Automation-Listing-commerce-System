import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import {
  createAdminWorkbenchSession,
  getAdminWorkbenchSession,
  logoutAdminWorkbench,
} from '../../services/auth/admin-workbench-session'
import {
  getAdminWorkbenchEntryRoute,
  resetAdminWorkbenchSessionOnLaunch,
} from './admin-workbench-entry'

describe('adminWorkbenchEntry', () => {
  beforeEach(() => {
    logoutAdminWorkbench()
  })

  it('routes the customer home manage entry to login when there is no admin session', () => {
    expect(getAdminWorkbenchEntryRoute()).toBe(routes.adminLogin)
  })

  it('routes the customer home manage entry to the workbench when a session exists', () => {
    createAdminWorkbenchSession({ account: 'admin', role: 'creator' })

    expect(getAdminWorkbenchEntryRoute()).toBe(routes.ownerDashboard)
  })

  it('clears the in-memory admin session on app launch', () => {
    createAdminWorkbenchSession({ account: 'admin', role: 'creator' })

    resetAdminWorkbenchSessionOnLaunch()

    expect(getAdminWorkbenchSession()).toBeNull()
    expect(getAdminWorkbenchEntryRoute()).toBe(routes.adminLogin)
  })
})
