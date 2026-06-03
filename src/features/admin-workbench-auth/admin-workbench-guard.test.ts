import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetNavigationStateForTests } from '../../app/navigation'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import {
  createAdminWorkbenchSession,
  getAdminWorkbenchSession,
  getAdminWorkbenchToken,
  logoutAdminWorkbench,
} from '../../services/auth/admin-workbench-session'
import {
  ensureAdminWorkbenchSession,
  ensureAdminWorkbenchSessionFromServer,
} from './admin-workbench-guard'

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient =>
  overrides as CloudBaseMallApiClient

describe('adminWorkbenchGuard', () => {
  beforeEach(() => {
    logoutAdminWorkbench()
    __resetNavigationStateForTests()
  })

  it('redirects to login when no token exists', async () => {
    const reLaunch = vi.fn()
    vi.stubGlobal('uni', { reLaunch })

    await expect(ensureAdminWorkbenchSessionFromServer()).resolves.toBe(false)
    expect(reLaunch).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/login/index' }))
  })

  it('refreshes role and permissions through getAdminSession before allowing access', async () => {
    const reLaunch = vi.fn()
    vi.stubGlobal('uni', { reLaunch })
    createAdminWorkbenchSession({
      adminToken: 'opaque-token',
      account: 'admin',
      role: 'staff',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })
    const client = createClient({
      getAdminSession: async () => ({
        account: 'admin',
        role: 'creator',
        permissions: ['workbenchAccess', 'accountManagement'],
        status: 'active',
        expiresAt: '2026-06-03T13:00:00.000Z',
      }),
    })

    await expect(ensureAdminWorkbenchSessionFromServer('accountManagement', client)).resolves.toBe(true)
    expect(getAdminWorkbenchSession()).toMatchObject({
      adminToken: 'opaque-token',
      role: 'creator',
      permissions: ['workbenchAccess', 'accountManagement'],
      expiresAt: '2026-06-03T13:00:00.000Z',
    })
    expect(reLaunch).not.toHaveBeenCalled()
  })

  it('clears invalid server tokens and redirects to login', async () => {
    const reLaunch = vi.fn()
    vi.stubGlobal('uni', { reLaunch })
    createAdminWorkbenchSession({
      adminToken: 'opaque-token',
      account: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })
    const client = createClient({
      getAdminSession: async () => {
        throw new Error('Invalid admin session')
      },
    })

    await expect(ensureAdminWorkbenchSessionFromServer('workbenchAccess', client)).resolves.toBe(false)
    expect(getAdminWorkbenchToken()).toBeNull()
    expect(reLaunch).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/login/index' }))
  })

  it('redirects to no-permission when the refreshed session lacks the required permission', async () => {
    const reLaunch = vi.fn()
    const showToast = vi.fn()
    vi.stubGlobal('uni', { reLaunch, showToast })
    createAdminWorkbenchSession({
      adminToken: 'opaque-token',
      account: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess', 'permissionManagement'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })
    const client = createClient({
      getAdminSession: async () => ({
        account: 'staff-a',
        role: 'staff',
        permissions: ['workbenchAccess'],
        status: 'active',
        expiresAt: '2026-06-03T13:00:00.000Z',
      }),
    })

    await expect(ensureAdminWorkbenchSessionFromServer('permissionManagement', client)).resolves.toBe(false)
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '无权限访问该模块' }))
    expect(reLaunch).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/owner/no-permission/index' }))
  })

  it('keeps the legacy sync guard using the current server snapshot for existing page callers', () => {
    const reLaunch = vi.fn()
    vi.stubGlobal('uni', { reLaunch })
    createAdminWorkbenchSession({
      adminToken: 'opaque-token',
      account: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess'],
      expiresAt: '2026-06-03T12:00:00.000Z',
    })

    expect(ensureAdminWorkbenchSession('workbenchAccess')).toBe(true)
    expect(ensureAdminWorkbenchSession('productManagement')).toBe(false)
  })
})
