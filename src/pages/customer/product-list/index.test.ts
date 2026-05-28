import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer product list shopping bag entry', () => {
  it('wires the reserved shopping-bag bottom-nav entry to the shopping-bag page', () => {
    expect(source).toContain('routes.customerShoppingBag')
    expect(source).toContain('goShoppingBag')
    expect(source).toContain('@tap="goShoppingBag"')
    expect(source).not.toContain('璐墿琚嬩负瑙嗚鍏ュ彛')
  })
})
