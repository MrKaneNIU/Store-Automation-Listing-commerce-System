import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')

describe('customer address page', () => {
  it('renders the address book through the page-state facade without direct storage writes', () => {
    expect(source).toContain('createCustomerAddressPageState')
    expect(source).toContain('addressState.handlePageShow()')
    expect(source).toContain('addressState.saveAddress()')
    expect(source).toContain('addressState.deleteAddress')
    expect(source).toContain('addressState.setDefaultAddress')
    expect(source).not.toContain('.collection(')
    expect(source).not.toContain('mockDb')
    expect(source).not.toContain('repository')
  })

  it('uses the existing customer mobile visual system with loading empty failure and retry states', () => {
    expect(source).toContain('class="page"')
    expect(source).toContain('background: #f8f8f8')
    expect(source).toContain('class="detail-header"')
    expect(source).toContain(':style="{ paddingTop: headerTopPadding }"')
    expect(source).toContain('hover-class="press-feedback"')
    expect(source).toContain('viewModel.loadingState === \'loading\'')
    expect(source).toContain('viewModel.loadingState === \'failed\'')
    expect(source).toContain('@tap="reload"')
    expect(source).toContain('viewModel.items.length === 0')
  })

  it('shows visible labels and field-local errors for every required address field', () => {
    expect(source).toContain('<text class="field-label">收货人</text>')
    expect(source).toContain('<text class="field-label">手机号</text>')
    expect(source).toContain('<text class="field-label">省份</text>')
    expect(source).toContain('<text class="field-label">城市</text>')
    expect(source).toContain('<text class="field-label">区县</text>')
    expect(source).toContain('<text class="field-label">详细地址</text>')
    expect(source).toContain('fieldErrors.contactName')
    expect(source).toContain('fieldErrors.phoneNumber')
    expect(source).toContain('fieldErrors.province')
    expect(source).toContain('fieldErrors.city')
    expect(source).toContain('fieldErrors.district')
    expect(source).toContain('fieldErrors.detail')
  })

  it('disables saving and deleting while commands are pending', () => {
    expect(source).toContain(':disabled="isSaveDisabled"')
    expect(source).toContain("{{ isSaving ? '保存中' : editingAddressId ? '保存修改' : '新增地址' }}")
    expect(source).toContain(':disabled="isDeletingAddress(item.id)"')
    expect(source).toContain("{{ isDeletingAddress(item.id) ? '删除中' : '删除' }}")
  })
})
