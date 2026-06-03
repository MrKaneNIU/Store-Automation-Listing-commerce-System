import { beforeEach, describe, expect, it } from 'vitest'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'
import {
  authorizeAdminAccount,
  createAdminAccount,
  disableAdminAccount,
  getAdminPermissionView,
  hasAdminPermission,
  refreshAdminPermissionView,
  resetAdminPermissionsForTests,
  revokeAdminSessions,
} from './admin-permissions'

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient =>
  overrides as CloudBaseMallApiClient

describe('admin permissions', () => {
  beforeEach(() => {
    resetAdminPermissionsForTests()
  })

  it('refreshes accounts and audit logs from server actions while preserving ViewModel labels', async () => {
    const client = createClient({
      listAdminAccounts: async () => ({
        accounts: [
          {
            id: 'account-admin',
            account: 'admin',
            role: 'creator',
            permissions: ['workbenchAccess', 'permissionManagement'],
            status: 'active',
            createdAt: '2026-06-03T10:00:00.000Z',
            updatedAt: '2026-06-03T10:00:00.000Z',
          },
        ],
      }),
      listAdminAuditLogs: async () => ({
        logs: [
          {
            id: 'audit-1',
            operatorAccount: 'admin',
            targetAccount: 'staff-a',
            action: 'createAdminAccount',
            result: 'success',
            details: {
              role: 'staff',
              permissions: ['workbenchAccess'],
            },
            createdAt: '2026-06-03T10:01:00.000Z',
          },
        ],
      }),
    })

    const view = await refreshAdminPermissionView('admin', client)

    expect(view.currentAccount).toMatchObject({
      account: 'admin',
      role: 'creator',
      roleLabel: '创作者',
      status: 'active',
      statusLabel: '启用中',
    })
    expect(view.accounts[0]?.permissionLabels).toContain('权限管理')
    expect(view.auditLogs[0]).toMatchObject({
      action: 'authorize',
      actionLabel: '授权',
      roleLabel: '员工',
      permissionLabels: ['工作台进入权限'],
    })
    expect(view.canGrantOwner).toBe(true)
    expect(getAdminPermissionView('admin')).toEqual(view)
    expect(hasAdminPermission('admin', 'permissionManagement')).toBe(true)
  })

  it('creates an account through createAdminAccount and requires an explicit password', async () => {
    const calls: unknown[] = []
    const client = createClient({
      createAdminAccount: async (input) => {
        calls.push(input)
        return {
          account: {
            id: 'account-staff-a',
            account: 'staff-a',
            role: 'staff',
            permissions: ['workbenchAccess'],
            status: 'active',
            createdAt: '2026-06-03T10:00:00.000Z',
            updatedAt: '2026-06-03T10:00:00.000Z',
          },
        }
      },
      listAdminAccounts: async () => ({ accounts: [] }),
      listAdminAuditLogs: async () => ({ logs: [] }),
    })

    await expect(createAdminAccount({
      account: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess'],
      initialPassword: '123',
    }, client)).resolves.toMatchObject({
      status: 'failed',
      message: '新密码至少 6 位',
    })

    await expect(createAdminAccount({
      account: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess'],
      initialPassword: 'staff-secret',
    }, client)).resolves.toMatchObject({
      status: 'success',
      message: '账号已创建',
    })
    expect(calls).toEqual([
      {
        account: 'staff-a',
        role: 'staff',
        permissions: ['workbenchAccess'],
        initialPassword: 'staff-secret',
      },
    ])
  })

  it('updates permissions through updateAdminPermissions instead of local account mutation', async () => {
    const calls: unknown[] = []
    const client = createClient({
      updateAdminPermissions: async (input) => {
        calls.push(input)
        return {
          account: {
            id: 'account-staff-a',
            account: 'staff-a',
            role: 'staff',
            permissions: ['workbenchAccess', 'productManagement'],
            status: 'active',
            createdAt: '2026-06-03T10:00:00.000Z',
            updatedAt: '2026-06-03T10:00:00.000Z',
          },
        }
      },
      listAdminAccounts: async () => ({ accounts: [] }),
      listAdminAuditLogs: async () => ({ logs: [] }),
    })

    const result = await authorizeAdminAccount({
      targetAccount: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess', 'productManagement'],
    }, client)

    expect(result).toMatchObject({
      status: 'success',
      message: '授权已保存',
    })
    expect(calls).toEqual([
      {
        targetAccount: 'staff-a',
        role: 'staff',
        permissions: ['workbenchAccess', 'productManagement'],
      },
    ])
  })

  it('surfaces permission update failures from mallApi', async () => {
    const client = createClient({
      updateAdminPermissions: async () => {
        throw new Error('Permission denied')
      },
    })

    await expect(authorizeAdminAccount({
      targetAccount: 'staff-a',
      role: 'staff',
      permissions: ['workbenchAccess'],
    }, client)).resolves.toMatchObject({
      status: 'failed',
      message: 'Permission denied',
    })
  })

  it('disables accounts and revokes sessions through mallApi actions', async () => {
    const calls: unknown[] = []
    const client = createClient({
      disableAdminAccount: async (input) => {
        calls.push(['disable', input])
        return {
          account: {
            id: 'account-staff-a',
            account: 'staff-a',
            role: 'staff',
            permissions: ['workbenchAccess'],
            status: 'disabled',
            createdAt: '2026-06-03T10:00:00.000Z',
            updatedAt: '2026-06-03T10:02:00.000Z',
          },
          revokedCount: 1,
        }
      },
      revokeAdminSessions: async (input) => {
        calls.push(['revoke', input])
        return { revokedCount: 1 }
      },
      listAdminAccounts: async () => ({ accounts: [] }),
      listAdminAuditLogs: async () => ({ logs: [] }),
    })

    await expect(disableAdminAccount({ targetAccount: 'staff-a' }, client)).resolves.toMatchObject({
      status: 'success',
      message: '账号权限已禁用',
    })
    await expect(revokeAdminSessions({ targetAccount: 'staff-a' }, client)).resolves.toMatchObject({
      status: 'success',
      message: '会话已撤销',
    })

    expect(calls).toEqual([
      ['disable', { targetAccount: 'staff-a' }],
      ['revoke', { targetAccount: 'staff-a' }],
    ])
  })

  it('surfaces disable and revoke failures from mallApi', async () => {
    const client = createClient({
      disableAdminAccount: async () => {
        throw new Error('Cannot disable creator')
      },
      revokeAdminSessions: async () => {
        throw new Error('Cannot revoke creator')
      },
    })

    await expect(disableAdminAccount({ targetAccount: 'admin' }, client)).resolves.toMatchObject({
      status: 'failed',
      message: 'Cannot disable creator',
    })
    await expect(revokeAdminSessions({ targetAccount: 'admin' }, client)).resolves.toMatchObject({
      status: 'failed',
      message: 'Cannot revoke creator',
    })
  })
})
