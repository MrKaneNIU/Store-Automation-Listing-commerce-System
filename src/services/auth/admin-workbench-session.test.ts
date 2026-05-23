import { beforeEach, describe, expect, it } from 'vitest'
import {
  createAdminWorkbenchSession,
  getAdminWorkbenchSession,
  logoutAdminWorkbench,
} from './admin-workbench-session'

describe('adminWorkbenchSession', () => {
  beforeEach(() => {
    logoutAdminWorkbench()
  })

  it('starts without an active session', () => {
    expect(getAdminWorkbenchSession()).toBeNull()
  })

  it('stores a creator session', () => {
    const session = createAdminWorkbenchSession({ account: 'admin', role: 'creator' })

    expect(session).toMatchObject({
      account: 'admin',
      role: 'creator',
    })
    expect(session.loggedInAt).toEqual(expect.any(String))
    expect(getAdminWorkbenchSession()).toEqual(session)
  })

  it('clears the session on logout', () => {
    createAdminWorkbenchSession({ account: 'admin', role: 'creator' })
    logoutAdminWorkbench()

    expect(getAdminWorkbenchSession()).toBeNull()
  })
})
