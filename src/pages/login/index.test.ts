import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { logoutAdminWorkbench } from '../../services/auth/admin-workbench-session'
import { submitAdminWorkbenchAuth } from '../../features/admin-workbench-auth/admin-workbench-auth'
import type { CloudBaseMallApiClient } from '../../services/cloudbase/mall-api-client'

const createClient = (overrides: Partial<CloudBaseMallApiClient>): CloudBaseMallApiClient =>
  overrides as CloudBaseMallApiClient

const loginPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('admin login page contract', () => {
  beforeEach(() => {
    logoutAdminWorkbench()
  })

  it('authenticates the workbench through the server login facade', async () => {
    const result = await submitAdminWorkbenchAuth({ account: 'admin', password: 'server-secret' }, createClient({
      adminLogin: async () => ({
        adminToken: 'opaque-token',
        account: 'admin',
        role: 'creator',
        permissions: ['workbenchAccess'],
        expiresAt: '2026-06-03T12:00:00.000Z',
      }),
    }))

    expect(result.status).toBe('success')
  })

  it('keeps the session closed when server credentials are rejected', async () => {
    const result = await submitAdminWorkbenchAuth({ account: 'admin', password: 'nope' }, createClient({
      adminLogin: async () => {
        throw new Error('账号或密码错误')
      },
    }))

    expect(result.status).toBe('failed')
  })

  it('does not expose the default credentials in the login UI', () => {
    const source = loginPageSource()

    expect(source).not.toContain("ref('admin')")
    expect(source).not.toContain("ref('123456')")
    expect(source).not.toContain('placeholder="admin"')
    expect(source).not.toContain('placeholder="123456"')
    expect(source).not.toContain('type="password"')
    expect(source).toContain('password')
  })

  it('matches the PRD login structure and visual affordances', () => {
    const source = loginPageSource()

    expect(source).toContain('class="back-button"')
    expect(source).toContain('@tap="goBack"')
    expect(source).toContain('class="account-check"')
    expect(source).toContain('Forgot your password?')
    expect(source).toContain('class="submit-label">LOGIN</text>')
    expect(source).toContain('width: 100%;')
    expect(source).toContain('letter-spacing: 0;')
  })

  it('awaits the async server login facade before routing to the dashboard', () => {
    const source = loginPageSource()

    expect(source).toContain('const handleSubmit = async () =>')
    expect(source).toContain('await submitAdminWorkbenchAuth')
    expect(source).toContain('relaunchTo(routes.ownerDashboard)')
  })
})
