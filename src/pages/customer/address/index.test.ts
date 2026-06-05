import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer address placeholder page', () => {
  it('renders a safe address placeholder without address-book writes', () => {
    expect(source).toContain('地址')
    expect(source).toContain('地址功能暂未开通')
    expect(source).not.toContain('saveAddress')
    expect(source).not.toContain('deleteAddress')
    expect(source).not.toContain('collection')
    expect(source).not.toContain('repository')
    expect(source).not.toContain('cloudbase')
  })
})
