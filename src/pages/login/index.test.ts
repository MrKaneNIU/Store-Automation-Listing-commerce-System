import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { logoutAdminWorkbench } from '../../services/auth/admin-workbench-session'
import { submitAdminWorkbenchAuth } from '../../features/admin-workbench-auth/admin-workbench-auth'

const loginPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('admin login page contract', () => {
  beforeEach(() => {
    logoutAdminWorkbench()
  })

  it('lets the default credentials authenticate the workbench', () => {
    const result = submitAdminWorkbenchAuth({ account: 'admin', password: '123456' })

    expect(result.status).toBe('success')
  })

  it('keeps the session closed when credentials are wrong', () => {
    const result = submitAdminWorkbenchAuth({ account: 'admin', password: 'nope' })

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
})
