import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer orders page', () => {
  it('renders customer-owned orders from page state without order mutation actions', () => {
    expect(source).toContain('createCustomerOrdersPageState')
    expect(source).toContain('onShow')
    expect(source).toContain('viewModel.items')
    expect(source).toContain('viewModel.totalCountLabel')
    expect(source).toContain('customer-scoped')
    expect(source).toContain('reload')
    expect(source).not.toContain('confirmOrder')
    expect(source).not.toContain('cancelOrder')
    expect(source).not.toContain('payOrder')
    expect(source).not.toContain('repository')
    expect(source).not.toContain('cloudbase')
    expect(source).not.toContain('mallApi')
  })
})
