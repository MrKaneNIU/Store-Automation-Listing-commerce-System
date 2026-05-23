import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const accountManagementPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('owner account management page contract', () => {
  it('splits account registration and password change into two explicit entries', () => {
    const source = accountManagementPageSource()

    expect(source).toContain("activeMode = ref<'register' | 'password'>('register')")
    expect(source).toContain("setMode('register')")
    expect(source).toContain("setMode('password')")
    expect(source).toContain('账号注册')
    expect(source).toContain('修改密码')
    expect(source).toContain('authorizeAdminAccount')
  })

  it('does not render the dark explainer module above the account actions', () => {
    const source = accountManagementPageSource()

    expect(source).not.toContain('class="hero"')
    expect(source).not.toContain('ACCOUNT ACCESS')
    expect(source).not.toContain('注册账号与修改密码分开处理')
  })

  it('requires an account id before changing a password', () => {
    const source = accountManagementPageSource()

    expect(source).toContain('passwordAccountId')
    expect(source).toContain('账号ID')
    expect(source).toContain('oldPassword.value')
    expect(source).toContain('newPassword.value')
    expect(source).toContain('confirmPassword.value')
    expect(source).toContain('account: passwordAccountId.value.trim()')
    expect(source).not.toContain('account: currentAccount.value')
  })

  it('requires login again directly after a successful password change', () => {
    const source = accountManagementPageSource()

    expect(source).toContain("relaunchTo(routes.adminLogin)")
    expect(source).not.toContain("redirectTo(routes.ownerDashboard)")
  })

  it('clears sensitive password fields whenever the page is shown', () => {
    const source = accountManagementPageSource()

    expect(source).toContain('const clearPasswordFields = () =>')
    expect(source).toContain('clearPasswordFields()')
    expect(source).toContain('passwordAccountId.value =')
    expect(source).toContain('oldPassword.value =')
    expect(source).toContain('newPassword.value =')
    expect(source).toContain('confirmPassword.value =')
  })
})
