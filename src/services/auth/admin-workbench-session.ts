import { nowIso } from '../../domain/shared/ids'

export type AdminWorkbenchRole = 'creator' | 'owner' | 'staff'

export type AdminWorkbenchSessionSnapshot = {
  account: string
  role: AdminWorkbenchRole
  permissions: string[]
  expiresAt: string
  status?: 'active'
}

export type AdminWorkbenchSession = AdminWorkbenchSessionSnapshot & {
  adminToken: string
  loggedInAt: string
}

type CreateAdminWorkbenchSessionInput = AdminWorkbenchSessionSnapshot & {
  adminToken: string
}

const adminTokenStorageKey = 'vx-admin-workbench-token'

let currentAdminToken: string | null = null
let currentSessionSnapshot: (AdminWorkbenchSessionSnapshot & { loggedInAt: string }) | null = null

const getStorageRuntime = () => {
  if (typeof uni === 'undefined') {
    return null
  }

  return uni
}

const readStoredAdminToken = (): string | null => {
  try {
    const token = getStorageRuntime()?.getStorageSync(adminTokenStorageKey)
    return typeof token === 'string' && token ? token : null
  } catch {
    return null
  }
}

const writeStoredAdminToken = (adminToken: string) => {
  try {
    getStorageRuntime()?.setStorageSync(adminTokenStorageKey, adminToken)
  } catch {
    // In unit tests or restricted runtimes, the in-memory token remains the source for this process.
  }
}

const removeStoredAdminToken = () => {
  try {
    getStorageRuntime()?.removeStorageSync(adminTokenStorageKey)
  } catch {
    // Best effort cleanup only.
  }
}

const copySession = (): AdminWorkbenchSession | null => {
  const adminToken = getAdminWorkbenchToken()
  if (!adminToken || !currentSessionSnapshot) {
    return null
  }

  return {
    ...currentSessionSnapshot,
    adminToken,
    permissions: [...currentSessionSnapshot.permissions],
  }
}

export const getAdminWorkbenchToken = (): string | null => {
  if (!currentAdminToken) {
    currentAdminToken = readStoredAdminToken()
  }

  return currentAdminToken
}

export const getAdminWorkbenchSession = (): AdminWorkbenchSession | null => copySession()

export const createAdminWorkbenchSession = (session: CreateAdminWorkbenchSessionInput): AdminWorkbenchSession => {
  currentAdminToken = session.adminToken
  writeStoredAdminToken(session.adminToken)
  currentSessionSnapshot = {
    account: session.account,
    role: session.role,
    permissions: [...session.permissions],
    expiresAt: session.expiresAt,
    status: session.status,
    loggedInAt: nowIso(),
  }

  return copySession() as AdminWorkbenchSession
}

export const refreshAdminWorkbenchSessionSnapshot = (
  snapshot: AdminWorkbenchSessionSnapshot,
): AdminWorkbenchSession | null => {
  const adminToken = getAdminWorkbenchToken()
  if (!adminToken) {
    currentSessionSnapshot = null
    return null
  }

  currentSessionSnapshot = {
    account: snapshot.account,
    role: snapshot.role,
    permissions: [...snapshot.permissions],
    expiresAt: snapshot.expiresAt,
    status: snapshot.status,
    loggedInAt: currentSessionSnapshot?.loggedInAt ?? nowIso(),
  }

  return copySession()
}

export const clearAdminWorkbenchSessionSnapshot = (): void => {
  currentSessionSnapshot = null
}

export const logoutAdminWorkbench = (): void => {
  currentAdminToken = null
  currentSessionSnapshot = null
  removeStoredAdminToken()
}
