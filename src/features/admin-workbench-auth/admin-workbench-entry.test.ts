import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import {
  createAdminWorkbenchSession,
  getAdminWorkbenchSession,
  getAdminWorkbenchToken,
  logoutAdminWorkbench,
  clearAdminWorkbenchSessionSnapshot,
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
    createAdminWorkbenchSession({
      adminToken: 'opaque-token',
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })

    expect(getAdminWorkbenchEntryRoute()).toBe(routes.ownerDashboard)
  })

  it('routes the customer home manage entry to the workbench when only a token exists', () => {
    createAdminWorkbenchSession({
      adminToken: 'opaque-token',
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })
    clearAdminWorkbenchSessionSnapshot()

    expect(getAdminWorkbenchSession()).toBeNull()
    expect(getAdminWorkbenchToken()).toBe('opaque-token')
    expect(getAdminWorkbenchEntryRoute()).toBe(routes.ownerDashboard)
  })

  it('clears the in-memory admin session snapshot on app launch without clearing the token', () => {
    createAdminWorkbenchSession({
      adminToken: 'opaque-token',
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })

    resetAdminWorkbenchSessionOnLaunch()

    expect(getAdminWorkbenchSession()).toBeNull()
    expect(getAdminWorkbenchToken()).toBe('opaque-token')
    expect(getAdminWorkbenchEntryRoute()).toBe(routes.ownerDashboard)
  })
})
