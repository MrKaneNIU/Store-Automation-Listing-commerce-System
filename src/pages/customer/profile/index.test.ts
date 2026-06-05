import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer profile placeholder page', () => {
  it('renders a safe personal-info placeholder without direct persistence', () => {
    expect(source).toContain('个人信息')
    expect(source).toContain('资料完善将在后续阶段开放')
    expect(source).not.toContain('collection')
    expect(source).not.toContain('repository')
    expect(source).not.toContain('cloudbase')
    expect(source).not.toContain('mallApi')
  })
})
