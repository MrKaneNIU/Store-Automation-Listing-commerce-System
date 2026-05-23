import { beforeEach, describe, expect, it } from 'vitest'
import {
  authorizeAdminAccount,
  disableAdminAccount,
  getAdminPermissionView,
  hasAdminPermission,
  resetAdminPermissionsForTests,
} from './admin-permissions'

describe('admin permissions', () => {
  beforeEach(() => {
    resetAdminPermissionsForTests()
  })

  it('shows the creator account with the full permission scope', () => {
    const view = getAdminPermissionView('admin')

    expect(view.currentAccount).toMatchObject({
      account: 'admin',
      role: 'creator',
      roleLabel: '创作者',
      status: 'active',
      statusLabel: '启用中',
    })
    expect(view.accounts).toHaveLength(1)
    expect(view.accounts[0]?.permissions).toContain('permissionManagement')
    expect(view.accounts[0]?.permissionLabels).toContain('权限管理')
    expect(view.canGrantOwner).toBe(true)
  })

  it('lets the creator authorize an owner account and records the operation', () => {
    const result = authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'shop-owner',
      role: 'owner',
      permissions: ['workbenchAccess', 'productManagement', 'orderConfirmation', 'more'],
    })

    expect(result.status).toBe('success')
    expect(getAdminPermissionView('admin').accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          account: 'shop-owner',
          role: 'owner',
          status: 'active',
        }),
      ]),
    )
    expect(getAdminPermissionView('admin').auditLogs.at(-1)).toMatchObject({
      operatorAccount: 'admin',
      targetAccount: 'shop-owner',
      action: 'authorize',
      actionLabel: '授权',
      roleLabel: '店铺老板',
      permissionLabels: ['工作台进入权限', '商品管理', '订单确认', '更多'],
    })
  })

  it('lets an owner authorize staff only within the owner scope', () => {
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'shop-owner',
      role: 'owner',
      permissions: ['workbenchAccess', 'productManagement', 'more', 'permissionManagement'],
    })

    const result = authorizeAdminAccount({
      operatorAccount: 'shop-owner',
      targetAccount: 'stylist-01',
      role: 'staff',
      permissions: ['workbenchAccess', 'productManagement'],
    })

    expect(result.status).toBe('success')
    expect(hasAdminPermission('stylist-01', 'productManagement')).toBe(true)
  })

  it('blocks owners from granting permissions outside their own scope', () => {
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'shop-owner',
      role: 'owner',
      permissions: ['workbenchAccess', 'productManagement', 'permissionManagement'],
    })

    const result = authorizeAdminAccount({
      operatorAccount: 'shop-owner',
      targetAccount: 'stylist-01',
      role: 'staff',
      permissions: ['orderConfirmation'],
    })

    expect(result).toMatchObject({
      status: 'failed',
      message: '无权授予超出自身范围的权限',
    })
    expect(hasAdminPermission('stylist-01', 'orderConfirmation')).toBe(false)
  })

  it('does not allow the creator account to be overwritten by authorization', () => {
    const result = authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'admin',
      role: 'owner',
      permissions: ['workbenchAccess'],
    })

    expect(result).toMatchObject({
      status: 'failed',
      message: '创作者账号不可覆盖',
    })
    expect(getAdminPermissionView('admin').currentAccount).toMatchObject({
      account: 'admin',
      role: 'creator',
      status: 'active',
    })
    expect(hasAdminPermission('admin', 'permissionManagement')).toBe(true)
  })

  it('rejects blank account authorization without creating a hidden account', () => {
    const result = authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: '   ',
      role: 'staff',
      permissions: ['workbenchAccess'],
    })

    expect(result).toMatchObject({
      status: 'failed',
      message: '账号不能为空',
    })
    expect(getAdminPermissionView('admin').accounts).toHaveLength(1)
  })

  it('rejects authorization without any permission scope', () => {
    const result = authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'stylist-01',
      role: 'staff',
      permissions: [],
    })

    expect(result).toMatchObject({
      status: 'failed',
      message: '至少选择一个权限范围',
    })
    expect(getAdminPermissionView('admin').accounts).toHaveLength(1)
  })

  it('disables an account and records the revoke action', () => {
    authorizeAdminAccount({
      operatorAccount: 'admin',
      targetAccount: 'shop-owner',
      role: 'owner',
      permissions: ['workbenchAccess'],
    })

    const result = disableAdminAccount({ operatorAccount: 'admin', targetAccount: 'shop-owner' })

    expect(result.status).toBe('success')
    expect(hasAdminPermission('shop-owner', 'workbenchAccess')).toBe(false)
    expect(getAdminPermissionView('admin').auditLogs.at(-1)).toMatchObject({
      action: 'disable',
      actionLabel: '禁用',
      targetAccount: 'shop-owner',
      roleLabel: '店铺老板',
      permissionLabels: ['工作台进入权限'],
    })
  })
})
