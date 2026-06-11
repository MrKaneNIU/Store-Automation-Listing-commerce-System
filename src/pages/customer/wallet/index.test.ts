import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer wallet page', () => {
  it('renders the read-only wallet page through the page-state facade', () => {
    expect(source).toContain('createCustomerWalletPageState')
    expect(source).toContain('walletState.handlePageShow()')
    expect(source).toContain('walletState.reload()')
    expect(source).toContain('viewModel.balanceText')
    expect(source).toContain('viewModel.ledger')
    expect(source).not.toContain('.collection(')
    expect(source).not.toContain('repository')
    expect(source).not.toContain('getRuntimeCloudBaseMallApiClient')
  })

  it('keeps current customer mobile style and feedback states', () => {
    expect(source).toContain('background: #f8f8f8')
    expect(source).toContain('class="detail-header"')
    expect(source).toContain(':style="{ paddingTop: headerTopPadding }"')
    expect(source).toContain('hover-class="press-feedback"')
    expect(source).toContain('viewModel.loadingState === \'loading\'')
    expect(source).toContain('viewModel.loadingState === \'failed\'')
    expect(source).toContain('viewModel.loadingState === \'refreshing\'')
    expect(source).toContain('@tap="reload"')
    expect(source).toContain('viewModel.ledger.length === 0')
  })

  it('does not expose recharge withdraw payment or mutable finance controls', () => {
    expect(source).toContain('钱包当前仅支持余额和流水查看')
    expect(source).not.toContain('充值')
    expect(source).not.toContain('提现')
    expect(source).not.toContain('支付通道')
    expect(source).not.toContain('createWallet')
    expect(source).not.toContain('updateWallet')
    expect(source).not.toContain('saveWallet')
  })
})
