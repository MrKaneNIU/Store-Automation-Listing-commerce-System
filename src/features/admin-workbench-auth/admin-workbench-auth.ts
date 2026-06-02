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
const passwordHashByAccount = new Map<string, string>()

const hashAdminWorkbenchPassword = (account: string, password: string) => {
  const input = `${account.trim()}:vx-admin:${password}`
  let hash = 5381
  for (const char of input) {
    hash = (hash * 33 + char.charCodeAt(0)) % 2147483647
  }
  return `local:${hash.toString(36)}`
}

export const resetAdminWorkbenchPasswordsForTests = () => {
  passwordHashByAccount.clear()
}

const getPasswordHashForAccount = (account: string) => {
  const storedHash = passwordHashByAccount.get(account)
  if (storedHash) {
    return storedHash
  }
  return account === 'admin' ? hashAdminWorkbenchPassword(account, INITIAL_PASSWORD) : null
}

const passwordMatchesAccount = (account: string, password: string) =>
  getPasswordHashForAccount(account) === hashAdminWorkbenchPassword(account, password)

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

    if (!account || !passwordMatchesAccount(credentials.account, credentials.password)) {
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
  if (!passwordMatchesAccount(params.account, params.oldPassword)) {
    return { status: 'failed', message: '旧密码不正确' }
  }
  if (nextPassword.length < 6) {
    return { status: 'failed', message: '新密码至少 6 位' }
  }
  if (nextPassword !== params.confirmPassword.trim()) {
    return { status: 'failed', message: '两次输入的新密码不一致' }
  }

  passwordHashByAccount.set(account.account, hashAdminWorkbenchPassword(account.account, nextPassword))
  logoutAdminWorkbench()

  return { status: 'success', message: '密码已修改，请重新登录' }
}

export const setAdminWorkbenchInitialPassword = (params: {
  account: string
  password: string
  confirmPassword: string
}): AdminWorkbenchPasswordChangeResult => {
  const account = getAdminPermissionView(params.account).currentAccount
  const nextPassword = params.password.trim()

  if (!account) {
    return { status: 'failed', message: '账号不可用' }
  }
  if (nextPassword.length < 6) {
    return { status: 'failed', message: '新密码至少 6 位' }
  }
  if (nextPassword !== params.confirmPassword.trim()) {
    return { status: 'failed', message: '两次输入的新密码不一致' }
  }

  passwordHashByAccount.set(account.account, hashAdminWorkbenchPassword(account.account, nextPassword))
  return { status: 'success', message: '初始密码已设置' }
}

export const signOutAdminWorkbench = () => {
  logoutAdminWorkbench()
}
