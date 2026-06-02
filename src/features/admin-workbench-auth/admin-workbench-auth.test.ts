import { beforeEach, describe, expect, it } from 'vitest'
import {
  changeAdminWorkbenchPassword,
  createAdminWorkbenchAuthView,
  resetAdminWorkbenchPasswordsForTests,
  setAdminWorkbenchInitialPassword,
  submitAdminWorkbenchAuth,
} from './admin-workbench-auth'
import { logoutAdminWorkbench } from '../../services/auth/admin-workbench-session'
import { authorizeAdminAccount, resetAdminPermissionsForTests } from '../admin-permissions/admin-permissions'

describe('adminWorkbenchAuth', () => {
  beforeEach(() => {
    resetAdminPermissionsForTests()
    resetAdminWorkbenchPasswordsForTests()
    logoutAdminWorkbench()
  })

  it('shows the login gate when there is no session', () => {
    expect(createAdminWorkbenchAuthView()).toMatchObject({
      isLoggedIn: false,
      account: '',
      message: '',
    })
  })

  it('accepts the initial account password and exposes an authenticated view', () => {
    const result = submitAdminWorkbenchAuth({ account: 'admin', password: '123456' })

    expect(result).toMatchObject({
      status: 'success',
      message: '登录成功',
      session: {
        account: 'admin',
        role: 'creator',
      },
    })
    expect(createAdminWorkbenchAuthView()).toMatchObject({
      isLoggedIn: true,
      account: 'admin',
      role: 'creator',
    })
  })

  it('surfaces a clear error for invalid credentials', () => {
    expect(submitAdminWorkbenchAuth({ account: 'admin', password: 'wrong' })).toMatchObject({
      status: 'failed',
      message: '账号或密码错误',
    })
    expect(createAdminWorkbenchAuthView()).toMatchObject({
      isLoggedIn: false,
    })
  })

  it('sets an explicit initial password for newly authorized accounts', () => {
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess'],
    })

    expect(setAdminWorkbenchInitialPassword({
      account: 'staff-a',
      password: 'abc123',
      confirmPassword: 'abc123',
    })).toMatchObject({
      status: 'success',
      message: '初始密码已设置',
    })
    expect(submitAdminWorkbenchAuth({ account: 'staff-a', password: '123456' }).status).toBe('failed')
    expect(submitAdminWorkbenchAuth({ account: 'staff-a', password: 'abc123' })).toMatchObject({
      status: 'success',
      session: {
        account: 'staff-a',
      },
    })
  })

  it('does not let newly authorized accounts log in with the shared creator default password', () => {
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess'],
    })

    expect(submitAdminWorkbenchAuth({ account: 'staff-a', password: '123456' })).toMatchObject({
      status: 'failed',
      message: '账号或密码错误',
    })
  })

  it('rejects unusable initial passwords before login', () => {
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess'],
    })

    expect(setAdminWorkbenchInitialPassword({
      account: 'staff-a',
      password: '123',
      confirmPassword: '123',
    })).toMatchObject({
      status: 'failed',
      message: '新密码至少 6 位',
    })
    expect(setAdminWorkbenchInitialPassword({
      account: 'staff-a',
      password: 'abc123',
      confirmPassword: 'abc124',
    })).toMatchObject({
      status: 'failed',
      message: '两次输入的新密码不一致',
    })
  })

  it('changes the current account password and clears the active session', () => {
    submitAdminWorkbenchAuth({ account: 'admin', password: '123456' })

    const result = changeAdminWorkbenchPassword({
      account: 'admin',
      oldPassword: '123456',
      newPassword: '654321',
      confirmPassword: '654321',
    })

    expect(result).toMatchObject({
      status: 'success',
      message: '密码已修改，请重新登录',
    })
    expect(createAdminWorkbenchAuthView().isLoggedIn).toBe(false)
    expect(submitAdminWorkbenchAuth({ account: 'admin', password: '123456' }).status).toBe('failed')
    expect(submitAdminWorkbenchAuth({ account: 'admin', password: '654321' })).toMatchObject({
      status: 'success',
      session: {
        account: 'admin',
      },
    })
  })

  it('keeps the old password when old password validation fails', () => {
    const result = changeAdminWorkbenchPassword({
      account: 'admin',
      oldPassword: 'wrong',
      newPassword: '654321',
      confirmPassword: '654321',
    })

    expect(result).toMatchObject({
      status: 'failed',
      message: '旧密码不正确',
    })
    expect(submitAdminWorkbenchAuth({ account: 'admin', password: '123456' }).status).toBe('success')
  })

  it('rejects mismatched or too short new passwords', () => {
    expect(
      changeAdminWorkbenchPassword({
        account: 'admin',
        oldPassword: '123456',
        newPassword: '123',
        confirmPassword: '123',
      }),
    ).toMatchObject({
      status: 'failed',
      message: '新密码至少 6 位',
    })

    expect(
      changeAdminWorkbenchPassword({
        account: 'admin',
        oldPassword: '123456',
        newPassword: '654321',
        confirmPassword: '654322',
      }),
    ).toMatchObject({
      status: 'failed',
      message: '两次输入的新密码不一致',
    })
  })
})
