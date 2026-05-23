import {
  createAdminWorkbenchSession,
  getAdminWorkbenchSession,
  logoutAdminWorkbench,
  type AdminWorkbenchSession,
} from '../../services/auth/admin-workbench-session'
import {
  getAdminPermissionView,
  hasAdminPermission,
} from '../admin-permissions/admin-permissions'

export type AdminWorkbenchAuthView = {
  isLoggedIn: boolean
  account: string
  role: AdminWorkbenchSession['role'] | ''
  message: string
}

export type AdminWorkbenchAuthSubmitResult =
  | {
      status: 'success'
      session: AdminWorkbenchSession
      message: string
    }
  | {
      status: 'failed'
      session: null
      message: string
    }

export type AdminWorkbenchPasswordChangeResult = {
  status: 'success' | 'failed'
  message: string
}

const INITIAL_PASSWORD = '123456'
const passwordByAccount = new Map<string, string>()

export const resetAdminWorkbenchPasswordsForTests = () => {
  passwordByAccount.clear()
}

const getPasswordForAccount = (account: string) => passwordByAccount.get(account) ?? INITIAL_PASSWORD

export const createAdminWorkbenchAuthView = (): AdminWorkbenchAuthView => {
  const session = getAdminWorkbenchSession()

  return {
    isLoggedIn: Boolean(session),
    account: session?.account ?? '',
    role: session?.role ?? '',
    message: '',
  }
}

export const submitAdminWorkbenchAuth = (credentials: {
  account: string
  password: string
}): AdminWorkbenchAuthSubmitResult => {
  try {
    const account = getAdminPermissionView(credentials.account).currentAccount

    if (!account || credentials.password !== getPasswordForAccount(credentials.account)) {
      throw new Error('账号或密码错误')
    }
    if (!hasAdminPermission(account.account, 'workbenchAccess')) {
      throw new Error('账号无工作台进入权限')
    }

    const session = createAdminWorkbenchSession({
      account: account.account,
      role: account.role,
      permissions: account.permissions,
    })

    return {
      status: 'success',
      session,
      message: '登录成功',
    }
  } catch (error) {
    return {
      status: 'failed',
      session: null,
      message: error instanceof Error ? error.message : '登录失败',
    }
  }
}

export const changeAdminWorkbenchPassword = (params: {
  account: string
  oldPassword: string
  newPassword: string
  confirmPassword: string
}): AdminWorkbenchPasswordChangeResult => {
  const account = getAdminPermissionView(params.account).currentAccount
  const nextPassword = params.newPassword.trim()

  if (!account) {
    return { status: 'failed', message: '账号不可用' }
  }
  if (params.oldPassword !== getPasswordForAccount(params.account)) {
    return { status: 'failed', message: '旧密码不正确' }
  }
  if (nextPassword.length < 6) {
    return { status: 'failed', message: '新密码至少 6 位' }
  }
  if (nextPassword !== params.confirmPassword.trim()) {
    return { status: 'failed', message: '两次输入的新密码不一致' }
  }

  passwordByAccount.set(account.account, nextPassword)
  logoutAdminWorkbench()

  return { status: 'success', message: '密码已修改，请重新登录' }
}

export const signOutAdminWorkbench = () => {
  logoutAdminWorkbench()
}
