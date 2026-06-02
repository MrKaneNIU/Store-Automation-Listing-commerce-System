import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const stateSource = readFileSync(path.resolve(__dirname, 'useOwnerProductsPageState.ts'), 'utf8')

describe('owner products unified editing wiring', () => {
  it('renders product description summaries and the unified edit entry', () => {
    expect(source).toContain('{{ product.description || descriptionFallbackText }}')
    expect(source).toContain('@tap="openProductEditor(product)"')
    expect(source).toContain('class="description-summary"')
  })

  it('saves product basics through the CloudBase owner products facade', () => {
    expect(source).toContain("import { useOwnerProductsPageState } from './useOwnerProductsPageState'")
    expect(source).not.toContain('updateCloudBaseOwnerProductDescription')
    expect(stateSource).not.toContain('updateCloudBaseOwnerProductDescription')
    expect(stateSource).toContain('updateCloudBaseOwnerProductBasics')
    expect(source).toContain('saveProductBasics')
    expect(source).not.toContain('saveDescription')
    expect(source).not.toContain('mockDb')
    expect(source).not.toContain('mallRepository')
  })

  it('refreshes product and SKU views after a successful basics save', () => {
    expect(stateSource).toContain("if (result.message === '商品基础信息已保存') {")
    expect(stateSource).toContain('await refreshView()')
    expect(stateSource).toContain('await loadSkuInventory(editingProductId.value)')
    expect(stateSource).not.toContain("if (result.message === '商品基础信息已保存') {\n      closeProductEditor()")
  })

  it('opens the editor with an empty draft when older product records have no description', () => {
    expect(source).toContain('openProductEditor(product)')
    expect(stateSource).toContain('const openProductEditor = (product: OwnerProductListItem)')
    expect(stateSource).toContain("descriptionDraft.value = product.description || ''")
  })

  it('keeps the product basics description editor limited to 120 characters', () => {
    expect(source).toContain('maxlength="120"')
    expect(source).toContain('descriptionDraft.length')
    expect(source).toContain('/120')
  })

  it('keeps product code read-only in the unified editor', () => {
    expect(source).toContain('v-model="productCodeReadonly"')
    expect(source).toContain('disabled')
    expect(stateSource).toContain('productCodeReadonly.value = product.productCode')
    expect(stateSource).not.toContain('productCode: productCodeReadonly')
  })

  it('renders the SKU inventory workbench through CloudBase owner products facade calls', () => {
    expect(source).toContain('class="sku-row"')
    expect(source).not.toContain('getCloudBaseOwnerProductSkuInventoryView')
    expect(stateSource).toContain('getCloudBaseOwnerProductSkuInventoryView')
    expect(stateSource).toContain('updateCloudBaseOwnerProductSku')
    expect(stateSource).toContain('restockCloudBaseOwnerProductSkus')
    expect(stateSource).toContain('clearCloudBaseOwnerProductSkuStock')
    expect(source).not.toContain('mallRepository')
  })

  it('renders publish blocking reasons without writing directly to storage', () => {
    expect(source).toContain('product.publishBlockReasons')
    expect(source).toContain('class="publish-issues"')
    expect(source).toContain('class="publish-issue"')
    expect(source).not.toContain('mallRepository')
  })

  it('renders owner unpublish and delete actions through the page state composable', () => {
    expect(source).toContain('unpublishProduct(product.id)')
    expect(source).toContain('deleteProduct(product.id, product.productCode)')
    expect(source).not.toContain('unpublishCloudBaseOwnerProduct')
    expect(source).not.toContain('deleteCloudBaseOwnerProduct')
    expect(stateSource).toContain('unpublishCloudBaseOwnerProduct')
    expect(stateSource).toContain('deleteCloudBaseOwnerProduct')
  })
})
