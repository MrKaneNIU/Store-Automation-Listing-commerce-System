import { beforeEach, describe, expect, it } from 'vitest'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import {
  changeAdminWorkbenchPassword,
  createAdminWorkbenchAuthView,
  submitAdminWorkbenchAuth,
  signOutAdminWorkbench,
} from './admin-workbench-auth'
import {
  clearAdminWorkbenchSessionSnapshot,
  getAdminWorkbenchToken,
  logoutAdminWorkbench,
} from '../../services/auth/admin-workbench-session'

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient =>
  overrides as CloudBaseMallApiClient

describe('adminWorkbenchAuth', () => {
  beforeEach(() => {
    logoutAdminWorkbench()
  })

  it('shows the login gate when there is no session', () => {
    expect(createAdminWorkbenchAuthView()).toMatchObject({
      isLoggedIn: false,
      account: '',
      message: '',
    })
  })

  it('logs in through adminLogin and stores only the opaque token as local authority', async () => {
    const calls: unknown[] = []
    const client = createClient({
      adminLogin: async (input) => {
        calls.push(input)
        return {
          adminToken: 'opaque-token',
          account: 'admin',
          role: 'creator',
          permissions: ['workbenchAccess', 'permissionManagement'],
          expiresAt: '2026-06-03T12:00:00.000Z',
        }
      },
    })

    const result = await submitAdminWorkbenchAuth({ account: 'admin', password: 'server-secret' }, client)

    expect(calls).toEqual([{ account: 'admin', password: 'server-secret' }])
    expect(result).toMatchObject({
      status: 'success',
      message: '登录成功',
      session: {
        adminToken: 'opaque-token',
        account: 'admin',
        role: 'creator',
      },
    })
    expect(getAdminWorkbenchToken()).toBe('opaque-token')
    expect(createAdminWorkbenchAuthView()).toMatchObject({
      isLoggedIn: true,
      account: 'admin',
      role: 'creator',
    })
  })

  it('surfaces server login failures without creating a local token', async () => {
    const client = createClient({
      adminLogin: async () => {
        throw new Error('账号或密码错误')
      },
    })

    await expect(submitAdminWorkbenchAuth({ account: 'admin', password: 'wrong' }, client)).resolves.toMatchObject({
      status: 'failed',
      message: '账号或密码错误',
    })
    expect(getAdminWorkbenchToken()).toBeNull()
    expect(createAdminWorkbenchAuthView()).toMatchObject({
      isLoggedIn: false,
    })
  })

  it('changes password through the server action and clears the local token', async () => {
    await submitAdminWorkbenchAuth(
      { account: 'admin', password: 'server-secret' },
      createClient({
        adminLogin: async () => ({
          adminToken: 'opaque-token',
          account: 'admin',
          role: 'creator',
          permissions: ['workbenchAccess'],
          expiresAt: '2026-06-03T12:00:00.000Z',
        }),
      }),
    )
    const calls: unknown[] = []
    const client = createClient({
      changeAdminPassword: async (input) => {
        calls.push(input)
        return { changed: true }
      },
    })

    const result = await changeAdminWorkbenchPassword({
      account: 'admin',
      oldPassword: 'server-secret',
      newPassword: 'updated-secret',
      confirmPassword: 'updated-secret',
    }, client)

    expect(calls).toEqual([{ oldPassword: 'server-secret', newPassword: 'updated-secret' }])
    expect(result).toMatchObject({
      status: 'success',
      message: '密码已修改，请重新登录',
    })
    expect(getAdminWorkbenchToken()).toBeNull()
  })

  it('validates new password locally before calling changeAdminPassword', async () => {
    const calls: unknown[] = []
    const client = createClient({
      changeAdminPassword: async (input) => {
        calls.push(input)
        return { changed: true }
      },
    })

    await expect(
      changeAdminWorkbenchPassword({
        account: 'admin',
        oldPassword: 'server-secret',
        newPassword: '123',
        confirmPassword: '123',
      }, client),
    ).resolves.toMatchObject({
      status: 'failed',
      message: '新密码至少 6 位',
    })
    await expect(
      changeAdminWorkbenchPassword({
        account: 'admin',
        oldPassword: 'server-secret',
        newPassword: 'updated-secret',
        confirmPassword: 'different-secret',
      }, client),
    ).resolves.toMatchObject({
      status: 'failed',
      message: '两次输入的新密码不一致',
    })
    expect(calls).toEqual([])
  })

  it('surfaces server password change failures without clearing the token', async () => {
    await submitAdminWorkbenchAuth(
      { account: 'admin', password: 'server-secret' },
      createClient({
        adminLogin: async () => ({
          adminToken: 'opaque-token',
          account: 'admin',
          role: 'creator',
          permissions: ['workbenchAccess'],
          expiresAt: '2026-06-03T12:00:00.000Z',
        }),
      }),
    )
    const client = createClient({
      changeAdminPassword: async () => {
        throw new Error('当前密码错误')
      },
    })

    await expect(
      changeAdminWorkbenchPassword({
        account: 'admin',
        oldPassword: 'wrong-secret',
        newPassword: 'updated-secret',
        confirmPassword: 'updated-secret',
      }, client),
    ).resolves.toMatchObject({
      status: 'failed',
      message: '当前密码错误',
    })
    expect(getAdminWorkbenchToken()).toBe('opaque-token')
  })

  it('revokes the server session before clearing local logout state', async () => {
    await submitAdminWorkbenchAuth(
      { account: 'admin', password: 'server-secret' },
      createClient({
        adminLogin: async () => ({
          adminToken: 'opaque-token',
          account: 'admin',
          role: 'creator',
          permissions: ['workbenchAccess'],
          expiresAt: '2026-06-03T12:00:00.000Z',
        }),
      }),
    )
    const calls: string[] = []
    const client = createClient({
      adminLogout: async () => {
        calls.push('adminLogout')
        return { revoked: true }
      },
    })

    await signOutAdminWorkbench(client)

    expect(calls).toEqual(['adminLogout'])
    expect(getAdminWorkbenchToken()).toBeNull()
  })

  it('revokes the server session when only a restored admin token exists', async () => {
    await submitAdminWorkbenchAuth(
      { account: 'admin', password: 'server-secret' },
      createClient({
        adminLogin: async () => ({
          adminToken: 'opaque-token',
          account: 'admin',
          role: 'creator',
          permissions: ['workbenchAccess'],
          expiresAt: '2026-06-03T12:00:00.000Z',
        }),
      }),
    )
    clearAdminWorkbenchSessionSnapshot()
    const calls: string[] = []
    const client = createClient({
      adminLogout: async () => {
        calls.push('adminLogout')
        return { revoked: true }
      },
    })

    await signOutAdminWorkbench(client)

    expect(calls).toEqual(['adminLogout'])
    expect(getAdminWorkbenchToken()).toBeNull()
  })
})
