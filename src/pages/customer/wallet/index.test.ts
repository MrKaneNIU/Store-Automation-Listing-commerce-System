import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer wallet placeholder page', () => {
  it('renders a safe wallet placeholder without financial ledger behavior', () => {
    expect(source).toContain('钱包')
    expect(source).toContain('钱包功能暂未开通')
    expect(source).toContain('class="detail-header"')
    expect(source).toContain('class="icon-button plain"')
    expect(source).toContain('class="chevron"')
    expect(source).toContain('@tap="goMine"')
    expect(source).toContain('{{ backIcon }}')
    expect(source).toContain("const backIcon = '<'")
    expect(source).toContain(':style="{ paddingTop: headerTopPadding }"')
    expect(source).toContain('const HEADER_TOP_OFFSET_RPX = -8')
    expect(source).toContain('uni.getMenuButtonBoundingClientRect?.()')
    expect(source).toContain('redirectTo(routes.customerMine)')
    expect(source).not.toContain('&lt;')
    expect(source).not.toContain('back-button')
    expect(source).not.toContain('balance')
    expect(source).not.toContain('recharge')
    expect(source).not.toContain('withdraw')
    expect(source).not.toContain('ledger')
    expect(source).not.toContain('repository')
    expect(source).not.toContain('cloudbase')
  })
})
