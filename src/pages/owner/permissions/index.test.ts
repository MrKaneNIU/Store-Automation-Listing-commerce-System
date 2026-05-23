import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const permissionsPageSource = () => readFileSync(resolve(__dirname, 'index.vue'), 'utf8')

describe('owner permissions page contract', () => {
  it('renders user-facing labels instead of internal permission enums', () => {
    const source = permissionsPageSource()

    expect(source).toContain('account.roleLabel')
    expect(source).toContain('account.statusLabel')
    expect(source).toContain('account.permissionLabels.join')
    expect(source).toContain('log.actionLabel')
    expect(source).not.toContain('account.role }} · {{ account.status')
    expect(source).not.toContain('account.permissions.join')
    expect(source).not.toContain('{{ log.action }}')
  })
})
