import {
  createAdminWorkbenchSession,
  getAdminWorkbenchToken,
  getAdminWorkbenchSession,
  logoutAdminWorkbench,
  type AdminWorkbenchSession,
} from '../../services/auth/admin-workbench-session'
import { getRuntimeCloudBaseMallApiClient } from '../../services/cloudbase/runtime-mall-api-client'
import type { CloudBaseMallApiClient, CloudBaseMallApiClientWithAdmin } from '../../services/cloudbase/mall-api-client'

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

const getClient = (client?: CloudBaseMallApiClient): CloudBaseMallApiClientWithAdmin =>
  (client ?? getRuntimeCloudBaseMallApiClient()) as CloudBaseMallApiClientWithAdmin

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback

export const resetAdminWorkbenchPasswordsForTests = () => {
  // Kept as a no-op compatibility hook for older tests; passwords are now server-side only.
}

export const createAdminWorkbenchAuthView = (): AdminWorkbenchAuthView => {
  const session = getAdminWorkbenchSession()

  return {
    isLoggedIn: Boolean(session),
    account: session?.account ?? '',
    role: session?.role ?? '',
    message: '',
  }
}

export const submitAdminWorkbenchAuth = async (
  credentials: {
    account: string
    password: string
  },
  client?: CloudBaseMallApiClient,
): Promise<AdminWorkbenchAuthSubmitResult> => {
  try {
    const result = await getClient(client).adminLogin({
      account: credentials.account,
      password: credentials.password,
    })
    const session = createAdminWorkbenchSession({
      adminToken: result.adminToken,
      account: result.account,
      role: result.role,
      permissions: result.permissions,
      expiresAt: result.expiresAt,
      status: result.status,
    })

    return {
      status: 'success',
      session,
      message: '登录成功',
    }
  } catch (error) {
    logoutAdminWorkbench()
    return {
      status: 'failed',
      session: null,
      message: getErrorMessage(error, '登录失败'),
    }
  }
}

export const changeAdminWorkbenchPassword = async (
  params: {
    account: string
    oldPassword: string
    newPassword: string
    confirmPassword: string
  },
  client?: CloudBaseMallApiClient,
): Promise<AdminWorkbenchPasswordChangeResult> => {
  const nextPassword = params.newPassword.trim()

  if (nextPassword.length < 6) {
    return { status: 'failed', message: '新密码至少 6 位' }
  }
  if (nextPassword !== params.confirmPassword.trim()) {
    return { status: 'failed', message: '两次输入的新密码不一致' }
  }

  try {
    await getClient(client).changeAdminPassword({
      oldPassword: params.oldPassword,
      newPassword: nextPassword,
    })
    logoutAdminWorkbench()
    return { status: 'success', message: '密码已修改，请重新登录' }
  } catch (error) {
    return { status: 'failed', message: getErrorMessage(error, '密码修改失败') }
  }
}

export const setAdminWorkbenchInitialPassword = (
  params: {
    account: string
    password: string
    confirmPassword: string
  },
): AdminWorkbenchPasswordChangeResult => {
  const nextPassword = params.password.trim()

  if (nextPassword.length < 6) {
    return { status: 'failed', message: '新密码至少 6 位' }
  }
  if (nextPassword !== params.confirmPassword.trim()) {
    return { status: 'failed', message: '两次输入的新密码不一致' }
  }

  return { status: 'success', message: '初始密码校验通过' }
}

export const signOutAdminWorkbench = async (client?: CloudBaseMallApiClient) => {
  try {
    if (getAdminWorkbenchToken()) {
      await getClient(client).adminLogout()
    }
  } finally {
    logoutAdminWorkbench()
  }
}
