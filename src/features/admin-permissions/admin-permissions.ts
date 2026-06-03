import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type {
  AdminAccountRecord,
  AdminAuditLogRecord,
  CloudBaseMallApiClient,
  CloudBaseMallApiClientWithAdmin,
} from '../../services/cloudbase/mall-api-client'

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
  action: 'authorize' | 'disable' | 'revoke'
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
  revoke: '撤销会话',
}

const scopeLabelByValue = new Map(scopeOptions.map((scope) => [scope.value, scope.label]))

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClientWithAdmin =>
  (client ?? getRuntimeCloudBaseMallApiClient()) as CloudBaseMallApiClientWithAdmin

const getPermissionLabels = (permissions: AdminPermissionScope[]) =>
  permissions.map((permission) => scopeLabelByValue.get(permission) ?? permission)

let accounts: AdminAccount[] = []
let auditLogs: AdminPermissionAuditLog[] = []

const copyAccount = (account: AdminAccount): AdminAccount => ({
  ...account,
  permissions: [...account.permissions],
  permissionLabels: [...account.permissionLabels],
})

const copyAuditLog = (log: AdminPermissionAuditLog): AdminPermissionAuditLog => ({
  ...log,
  permissions: [...log.permissions],
  permissionLabels: [...log.permissionLabels],
})

const toPermissionScopes = (permissions: string[] | AdminPermissionScope[]): AdminPermissionScope[] =>
  permissions.filter((permission) =>
    allPermissionScopes.includes(permission as AdminPermissionScope),
  ) as AdminPermissionScope[]

const toAdminAccount = (account: AdminAccountRecord): AdminAccount => {
  const permissions = toPermissionScopes(account.permissions)

  return {
    account: account.account,
    role: account.role,
    roleLabel: roleLabels[account.role],
    permissions,
    permissionLabels: getPermissionLabels(permissions),
    status: account.status,
    statusLabel: statusLabels[account.status],
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

const normalizeAuditAction = (action: string): AdminPermissionAuditLog['action'] => {
  if (action === 'disableAdminAccount') {
    return 'disable'
  }
  if (action === 'revokeAdminSessions') {
    return 'revoke'
  }
  return 'authorize'
}

const readAuditPermissions = (details: Record<string, unknown> | undefined): AdminPermissionScope[] => {
  const permissions = details?.permissions
  return Array.isArray(permissions) ? toPermissionScopes(permissions as string[]) : []
}

const readAuditRole = (details: Record<string, unknown> | undefined): AdminRole | undefined => {
  const role = details?.role
  return role === 'creator' || role === 'owner' || role === 'staff' ? role : undefined
}

const toAuditLog = (log: AdminAuditLogRecord): AdminPermissionAuditLog => {
  const action = normalizeAuditAction(log.action)
  const permissions = readAuditPermissions(log.details)
  const role = readAuditRole(log.details)

  return {
    id: log.id,
    operatorAccount: log.operatorAccount ?? '',
    targetAccount: log.targetAccount ?? '',
    action,
    actionLabel: actionLabels[action],
    role,
    roleLabel: role ? roleLabels[role] : undefined,
    permissions,
    permissionLabels: getPermissionLabels(permissions),
    createdAt: log.createdAt,
  }
}

export const resetAdminPermissionsForTests = () => {
  accounts = [
    {
      account: 'admin',
      role: 'creator',
      roleLabel: roleLabels.creator,
      permissions: [...allPermissionScopes],
      permissionLabels: getPermissionLabels(allPermissionScopes),
      status: 'active',
      statusLabel: statusLabels.active,
      createdAt: '',
      updatedAt: '',
    },
  ]
  auditLogs = []
}

resetAdminPermissionsForTests()

const findAccount = (account: string) =>
  accounts.find((item) => item.account === account) ?? null

const findActiveAccount = (account: string) => {
  const current = findAccount(account)
  return current?.status === 'active' ? current : null
}

export const getAdminPermissionView = (currentAccount: string): AdminPermissionView => {
  const current = findActiveAccount(currentAccount)

  return {
    currentAccount: current ? copyAccount(current) : null,
    accounts: accounts.map(copyAccount),
    auditLogs: auditLogs.map(copyAuditLog),
    scopeOptions,
    canGrantOwner: current?.role === 'creator',
  }
}

export const refreshAdminPermissionView = async (
  currentAccount: string,
  client?: CloudBaseMallApiClient,
): Promise<AdminPermissionView> => {
  const api = getClient(client)
  const [accountResult, auditResult] = await Promise.all([
    api.listAdminAccounts(),
    api.listAdminAuditLogs(),
  ])

  accounts = accountResult.accounts.map(toAdminAccount)
  auditLogs = auditResult.logs.map(toAuditLog)

  return getAdminPermissionView(currentAccount)
}

export const hasAdminPermission = (
  account: string,
  permission: AdminPermissionScope,
): boolean => {
  const current = findActiveAccount(account)

  return Boolean(current?.permissions.includes(permission))
}

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

export const createAdminAccount = async (
  params: {
    account: string
    role: Exclude<AdminRole, 'creator'>
    permissions: AdminPermissionScope[]
    initialPassword: string
  },
  client?: CloudBaseMallApiClient,
): Promise<AdminPermissionCommandResult> => {
  const targetAccount = params.account.trim()
  const initialPassword = params.initialPassword.trim()

  if (!targetAccount) {
    return { status: 'failed', message: '账号不能为空' }
  }
  if (initialPassword.length < 6) {
    return { status: 'failed', message: '新密码至少 6 位' }
  }
  if (params.permissions.length === 0) {
    return { status: 'failed', message: '至少选择一个权限范围' }
  }

  try {
    await getClient(client).createAdminAccount({
      account: targetAccount,
      role: params.role,
      permissions: [...params.permissions],
      initialPassword,
    })
    await refreshAdminPermissionView(targetAccount, client)
    return { status: 'success', message: '账号已创建' }
  } catch (error) {
    return { status: 'failed', message: getErrorMessage(error, '账号创建失败') }
  }
}

export const authorizeAdminAccount = async (
  params: {
    targetAccount: string
    role: Exclude<AdminRole, 'creator'>
    permissions: AdminPermissionScope[]
  },
  client?: CloudBaseMallApiClient,
): Promise<AdminPermissionCommandResult> => {
  const targetAccount = params.targetAccount.trim()

  if (!targetAccount) {
    return { status: 'failed', message: '账号不能为空' }
  }
  if (params.permissions.length === 0) {
    return { status: 'failed', message: '至少选择一个权限范围' }
  }

  try {
    await getClient(client).updateAdminPermissions({
      targetAccount,
      role: params.role,
      permissions: [...params.permissions],
    })
    await refreshAdminPermissionView(targetAccount, client)
    return { status: 'success', message: '授权已保存' }
  } catch (error) {
    return { status: 'failed', message: getErrorMessage(error, '授权保存失败') }
  }
}

export const disableAdminAccount = async (
  params: {
    targetAccount: string
  },
  client?: CloudBaseMallApiClient,
): Promise<AdminPermissionCommandResult> => {
  try {
    await getClient(client).disableAdminAccount({ targetAccount: params.targetAccount })
    await refreshAdminPermissionView(params.targetAccount, client)
    return { status: 'success', message: '账号权限已禁用' }
  } catch (error) {
    return { status: 'failed', message: getErrorMessage(error, '账号禁用失败') }
  }
}

export const revokeAdminSessions = async (
  params: {
    targetAccount: string
  },
  client?: CloudBaseMallApiClient,
): Promise<AdminPermissionCommandResult> => {
  try {
    await getClient(client).revokeAdminSessions({ targetAccount: params.targetAccount })
    return { status: 'success', message: '会话已撤销' }
  } catch (error) {
    return { status: 'failed', message: getErrorMessage(error, '会话撤销失败') }
  }
}
