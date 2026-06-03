import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAdminWorkbenchSessionSnapshot,
  createAdminWorkbenchSession,
  getAdminWorkbenchToken,
  getAdminWorkbenchSession,
  logoutAdminWorkbench,
  refreshAdminWorkbenchSessionSnapshot,
} from './admin-workbench-session'

describe('adminWorkbenchSession', () => {
  beforeEach(() => {
    logoutAdminWorkbench()
  })

  it('starts without an active session', () => {
    expect(getAdminWorkbenchSession()).toBeNull()
  })

  it('persists only the opaque admin token and keeps role data as a display snapshot', () => {
    const session = createAdminWorkbenchSession({
      adminToken: 'opaque-token-1',
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess', 'permissionManagement'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })

    expect(session).toMatchObject({
      adminToken: 'opaque-token-1',
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess', 'permissionManagement'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })
    expect(session.loggedInAt).toEqual(expect.any(String))
    expect(getAdminWorkbenchToken()).toBe('opaque-token-1')
    expect(getAdminWorkbenchSession()).toEqual(session)
  })

  it('refreshes the display snapshot without replacing the persisted token', () => {
    createAdminWorkbenchSession({
      adminToken: 'opaque-token-1',
      account: 'admin',
      role: 'owner',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })

    const refreshed = refreshAdminWorkbenchSessionSnapshot({
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess', 'accountManagement', 'permissionManagement'],
      expiresAt: '2026-06-03T13:00:00.000Z',
    })

    expect(refreshed).toMatchObject({
      adminToken: 'opaque-token-1',
      role: 'creator',
      permissions: ['workbenchAccess', 'accountManagement', 'permissionManagement'],
      expiresAt: '2026-06-03T13:00:00.000Z',
    })
    expect(getAdminWorkbenchToken()).toBe('opaque-token-1')
  })

  it('clears the display snapshot without clearing the opaque token', () => {
    createAdminWorkbenchSession({
      adminToken: 'opaque-token-1',
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })

    clearAdminWorkbenchSessionSnapshot()

    expect(getAdminWorkbenchSession()).toBeNull()
    expect(getAdminWorkbenchToken()).toBe('opaque-token-1')
  })

  it('does not create a display snapshot when no admin token is persisted', () => {
    expect(refreshAdminWorkbenchSessionSnapshot({
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T13:00:00.000Z',
    })).toBeNull()
    expect(getAdminWorkbenchSession()).toBeNull()
  })

  it('clears the session on logout', () => {
    createAdminWorkbenchSession({
      adminToken: 'opaque-token-1',
      account: 'admin',
      role: 'creator',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })
    logoutAdminWorkbench()

    expect(getAdminWorkbenchSession()).toBeNull()
    expect(getAdminWorkbenchToken()).toBeNull()
  })
})
