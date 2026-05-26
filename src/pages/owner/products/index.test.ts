import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const source = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const stateSource = readFileSync(path.resolve(__dirname, 'useOwnerProductsPageState.ts'), 'utf8')

describe('owner products description editing wiring', () => {
  it('renders product description summaries and the edit entry', () => {
    expect(source).toContain('{{ product.description || descriptionFallbackText }}')
    expect(source).toContain('编辑简介')
    expect(source).toContain('class="description-summary"')
  })

  it('saves descriptions through the CloudBase owner products facade', () => {
    expect(source).toContain("import { useOwnerProductsPageState } from './useOwnerProductsPageState'")
    expect(source).not.toContain('updateCloudBaseOwnerProductDescription')
    expect(stateSource).toContain('updateCloudBaseOwnerProductDescription')
    expect(source).toContain('saveDescription')
    expect(source).not.toContain('mockDb')
    expect(source).not.toContain('mallRepository')
  })

  it('clears the modal editing state after a successful description save', () => {
    expect(stateSource).toContain("if (result.message === '商品简介已保存') {")
    expect(stateSource).toContain('resetDescriptionEditor()')
    expect(stateSource).not.toContain("if (result.message === '商品简介已保存') {\n      closeDescriptionEditor()")
  })

  it('opens the editor with an empty draft when older product records have no description', () => {
    expect(source).toContain("openDescriptionEditor(product.id, product.description || '')")
    expect(stateSource).toContain("const openDescriptionEditor = (productId: string, description = '')")
    expect(stateSource).toContain("descriptionDraft.value = description || ''")
  })

  it('keeps the first phase description editor limited to 120 characters', () => {
    expect(source).toContain('maxlength="120"')
    expect(source).toContain('descriptionDraft.length')
    expect(source).toContain('/120')
  })

  it('renders the SKU inventory workbench through CloudBase owner products facade calls', () => {
    expect(source).toContain('规格库存')
    expect(source).not.toContain('getCloudBaseOwnerProductSkuInventoryView')
    expect(stateSource).toContain('getCloudBaseOwnerProductSkuInventoryView')
    expect(stateSource).toContain('updateCloudBaseOwnerProductSku')
    expect(stateSource).toContain('restockCloudBaseOwnerProductSkus')
    expect(stateSource).toContain('clearCloudBaseOwnerProductSkuStock')
    expect(source).toContain('class="sku-row"')
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
