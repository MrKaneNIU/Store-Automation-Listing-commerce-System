import { beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetNavigationStateForTests } from '../../app/navigation'
import { ensureAdminWorkbenchSession } from './admin-workbench-guard'
import { logoutAdminWorkbench } from '../../services/auth/admin-workbench-session'
import {
  authorizeAdminAccount,
  disableAdminAccount,
  resetAdminPermissionsForTests,
} from '../admin-permissions/admin-permissions'
import { setAdminWorkbenchInitialPassword, submitAdminWorkbenchAuth } from './admin-workbench-auth'

describe('adminWorkbenchGuard', () => {
  beforeEach(() => {
    resetAdminPermissionsForTests()
    logoutAdminWorkbench()
    __resetNavigationStateForTests()
  })

  it('redirects to login when no session exists', () => {
    const reLaunch = vi.fn()
    vi.stubGlobal('uni', { reLaunch })

    expect(ensureAdminWorkbenchSession()).toBe(false)
    expect(reLaunch).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/login/index' }))
  })

  it('allows access when a session exists', () => {
    const reLaunch = vi.fn()
    vi.stubGlobal('uni', { reLaunch })
    submitAdminWorkbenchAuth({ account: 'admin', password: '123456' })

    expect(ensureAdminWorkbenchSession()).toBe(true)
    expect(reLaunch).not.toHaveBeenCalled()
  })

  it('blocks a signed-in account when the module permission is missing', () => {
    const reLaunch = vi.fn()
    const showToast = vi.fn()
    vi.stubGlobal('uni', { reLaunch, showToast })
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'staff-01',
      role: 'staff',
      permissions: ['workbenchAccess'],
    })
    setAdminWorkbenchInitialPassword({ account: 'staff-01', password: 'staff-pass', confirmPassword: 'staff-pass' })
    submitAdminWorkbenchAuth({ account: 'staff-01', password: 'staff-pass' })

    expect(ensureAdminWorkbenchSession('productManagement')).toBe(false)
    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '无权限访问该模块' }))
    expect(reLaunch).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/owner/no-permission/index' }))
  })

  it('blocks the current session when the account has been disabled', () => {
    const reLaunch = vi.fn()
    const showToast = vi.fn()
    vi.stubGlobal('uni', { reLaunch, showToast })
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'staff-01',
      role: 'staff',
      permissions: ['workbenchAccess'],
    })
    setAdminWorkbenchInitialPassword({ account: 'staff-01', password: 'staff-pass', confirmPassword: 'staff-pass' })
    submitAdminWorkbenchAuth({ account: 'staff-01', password: 'staff-pass' })
    disableAdminAccount({ operatorAccount: 'admin', targetAccount: 'staff-01' })

    expect(ensureAdminWorkbenchSession('workbenchAccess')).toBe(false)
    expect(reLaunch).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/login/index' }))
  })

  it('blocks a disabled account after the current session is cleared', () => {
    const reLaunch = vi.fn()
    vi.stubGlobal('uni', { reLaunch })
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'staff-01',
      role: 'staff',
      permissions: ['workbenchAccess'],
    })
    setAdminWorkbenchInitialPassword({ account: 'staff-01', password: 'staff-pass', confirmPassword: 'staff-pass' })
    submitAdminWorkbenchAuth({ account: 'staff-01', password: 'staff-pass' })
    logoutAdminWorkbench()

    expect(ensureAdminWorkbenchSession()).toBe(false)
    expect(reLaunch).toHaveBeenCalledWith(expect.objectContaining({ url: '/pages/login/index' }))
  })
})
