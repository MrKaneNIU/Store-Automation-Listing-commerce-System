import { nowIso } from '../../domain/shared/ids'

export type AdminRole = 'creator' | 'owner' | 'staff'

export type AdminPermissionScope =
  | 'workbenchAccess'
  | 'productManagement'
  | 'orderConfirmation'
  | 'more'
  | 'homepageSettings'
  | 'accountManagement'
  | 'permissionManagement'

export type AdminAccountStatus = 'active' | 'disabled'

export type AdminAccount = {
  account: string
  role: AdminRole
  roleLabel: string
  permissions: AdminPermissionScope[]
  permissionLabels: string[]
  status: AdminAccountStatus
  statusLabel: string
  createdAt: string
  updatedAt: string
}

export type AdminPermissionAuditLog = {
  id: string
  operatorAccount: string
  targetAccount: string
  action: 'authorize' | 'disable'
  actionLabel: string
  role?: AdminRole
  roleLabel?: string
  permissions: AdminPermissionScope[]
  permissionLabels: string[]
  createdAt: string
}

export type AdminPermissionView = {
  currentAccount: AdminAccount | null
  accounts: AdminAccount[]
  auditLogs: AdminPermissionAuditLog[]
  scopeOptions: Array<{
    label: string
    value: AdminPermissionScope
  }>
  canGrantOwner: boolean
}

export type AdminPermissionCommandResult = {
  status: 'success' | 'failed'
  message: string
}

const allPermissionScopes: AdminPermissionScope[] = [
  'workbenchAccess',
  'productManagement',
  'orderConfirmation',
  'more',
  'homepageSettings',
  'accountManagement',
  'permissionManagement',
]

const scopeOptions: AdminPermissionView['scopeOptions'] = [
  { label: '工作台进入权限', value: 'workbenchAccess' },
  { label: '商品管理', value: 'productManagement' },
  { label: '订单确认', value: 'orderConfirmation' },
  { label: '更多', value: 'more' },
  { label: '首页设置', value: 'homepageSettings' },
  { label: '账号管理', value: 'accountManagement' },
  { label: '权限管理', value: 'permissionManagement' },
]

const roleLabels: Record<AdminRole, string> = {
  creator: '创作者',
  owner: '店铺老板',
  staff: '员工',
}

const statusLabels: Record<AdminAccountStatus, string> = {
  active: '启用中',
  disabled: '已禁用',
}

const actionLabels: Record<AdminPermissionAuditLog['action'], string> = {
  authorize: '授权',
  disable: '禁用',
}

const scopeLabelByValue = new Map(scopeOptions.map((scope) => [scope.value, scope.label]))

const getPermissionLabels = (permissions: AdminPermissionScope[]) =>
  permissions.map((permission) => scopeLabelByValue.get(permission) ?? permission)

let auditSequence = 0
let accounts: AdminAccount[] = []
let auditLogs: AdminPermissionAuditLog[] = []

const createAccount = (
  account: string,
  role: AdminRole,
  permissions: AdminPermissionScope[],
  status: AdminAccountStatus,
): AdminAccount => {
  const timestamp = nowIso()

  return {
    account,
    role,
    roleLabel: roleLabels[role],
    permissions: [...permissions],
    permissionLabels: getPermissionLabels(permissions),
    status,
    statusLabel: statusLabels[status],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const resetAdminPermissionsForTests = () => {
  auditSequence = 0
  accounts = [
    createAccount('admin', 'creator', allPermissionScopes, 'active'),
  ]
  auditLogs = []
}

resetAdminPermissionsForTests()

const copyAccount = (account: AdminAccount): AdminAccount => ({
  ...account,
  permissions: [...account.permissions],
  permissionLabels: [...account.permissionLabels],
})

const findActiveAccount = (account: string) =>
  accounts.find((item) => item.account === account && item.status === 'active') ?? null

const isSubset = (candidate: AdminPermissionScope[], allowed: AdminPermissionScope[]) =>
  candidate.every((permission) => allowed.includes(permission))

const uniquePermissions = (permissions: AdminPermissionScope[]) => Array.from(new Set(permissions))

const addAuditLog = (
  operatorAccount: string,
  targetAccount: string,
  action: AdminPermissionAuditLog['action'],
  permissions: AdminPermissionScope[],
  role?: AdminRole,
) => {
  auditSequence += 1
  auditLogs = [
    ...auditLogs,
    {
      id: `admin-permission-log-${auditSequence}`,
      operatorAccount,
      targetAccount,
      action,
      actionLabel: actionLabels[action],
      role,
      roleLabel: role ? roleLabels[role] : undefined,
      permissions: [...permissions],
      permissionLabels: getPermissionLabels(permissions),
      createdAt: nowIso(),
    },
  ]
}

export const getAdminPermissionView = (currentAccount: string): AdminPermissionView => {
  const current = findActiveAccount(currentAccount)

  return {
    currentAccount: current ? copyAccount(current) : null,
    accounts: accounts.map(copyAccount),
    auditLogs: auditLogs.map((log) => ({
      ...log,
      permissions: [...log.permissions],
      permissionLabels: [...log.permissionLabels],
    })),
    scopeOptions,
    canGrantOwner: current?.role === 'creator',
  }
}

export const hasAdminPermission = (
  account: string,
  permission: AdminPermissionScope,
): boolean => {
  const current = findActiveAccount(account)

  return Boolean(current?.permissions.includes(permission))
}

export const authorizeAdminAccount = (params: {
  operatorAccount: string
  targetAccount: string
  role: Exclude<AdminRole, 'creator'>
  permissions: AdminPermissionScope[]
}): AdminPermissionCommandResult => {
  const operator = findActiveAccount(params.operatorAccount)
  const targetAccount = params.targetAccount.trim()
  const permissions = uniquePermissions(params.permissions)

  if (!operator?.permissions.includes('permissionManagement')) {
    return { status: 'failed', message: '无权执行授权操作' }
  }
  if (!targetAccount) {
    return { status: 'failed', message: '账号不能为空' }
  }
  if (permissions.length === 0) {
    return { status: 'failed', message: '至少选择一个权限范围' }
  }
  if (operator.role === 'owner' && params.role !== 'staff') {
    return { status: 'failed', message: '店铺老板只能授权员工' }
  }
  if (operator.role === 'owner' && !isSubset(permissions, operator.permissions)) {
    return { status: 'failed', message: '无权授予超出自身范围的权限' }
  }

  const timestamp = nowIso()
  const existing = accounts.find((account) => account.account === targetAccount)

  if (existing?.role === 'creator') {
    return { status: 'failed', message: '创作者账号不可覆盖' }
  }

  const nextAccount: AdminAccount = existing
    ? {
        ...existing,
        role: params.role,
        roleLabel: roleLabels[params.role],
        permissions: [...permissions],
        permissionLabels: getPermissionLabels(permissions),
        status: 'active',
        statusLabel: statusLabels.active,
        updatedAt: timestamp,
      }
    : {
        account: targetAccount,
        role: params.role,
        roleLabel: roleLabels[params.role],
        permissions: [...permissions],
        permissionLabels: getPermissionLabels(permissions),
        status: 'active',
        statusLabel: statusLabels.active,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

  accounts = existing
    ? accounts.map((account) => (account.account === targetAccount ? nextAccount : account))
    : [...accounts, nextAccount]
  addAuditLog(params.operatorAccount, targetAccount, 'authorize', permissions, params.role)

  return { status: 'success', message: '授权已保存' }
}

export const disableAdminAccount = (params: {
  operatorAccount: string
  targetAccount: string
}): AdminPermissionCommandResult => {
  const operator = findActiveAccount(params.operatorAccount)
  const target = accounts.find((account) => account.account === params.targetAccount)

  if (!operator?.permissions.includes('permissionManagement')) {
    return { status: 'failed', message: '无权执行禁用操作' }
  }
  if (!target || target.role === 'creator') {
    return { status: 'failed', message: '账号不可禁用' }
  }
  if (operator.role === 'owner' && !isSubset(target.permissions, operator.permissions)) {
    return { status: 'failed', message: '无权禁用超出自身范围的账号' }
  }

  accounts = accounts.map((account) =>
    account.account === params.targetAccount
      ? {
          ...account,
          status: 'disabled',
          statusLabel: statusLabels.disabled,
          updatedAt: nowIso(),
        }
      : account,
  )
  addAuditLog(params.operatorAccount, params.targetAccount, 'disable', target.permissions, target.role)

  return { status: 'success', message: '账号权限已禁用' }
}
