import { nowIso } from '../../domain/shared/ids'

export type AdminWorkbenchRole = 'creator' | 'owner' | 'staff'

export type AdminWorkbenchSession = {
  account: string
  role: AdminWorkbenchRole
  permissions: string[]
  loggedInAt: string
}

let currentSession: AdminWorkbenchSession | null = null

export const getAdminWorkbenchSession = (): AdminWorkbenchSession | null => {
  return currentSession ? { ...currentSession, permissions: [...currentSession.permissions] } : null
}

export const createAdminWorkbenchSession = (account: {
  account: string
  role: AdminWorkbenchRole
  permissions?: string[]
}): AdminWorkbenchSession => {
  currentSession = {
    account: account.account,
    role: account.role,
    permissions: [...(account.permissions ?? [])],
    loggedInAt: nowIso(),
  }

  return { ...currentSession, permissions: [...currentSession.permissions] }
}

export const logoutAdminWorkbench = (): void => {
  currentSession = null
}
