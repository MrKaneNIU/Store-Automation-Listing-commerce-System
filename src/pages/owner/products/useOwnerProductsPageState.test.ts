import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { useOwnerProductsPageState } from './useOwnerProductsPageState'

const pageSource = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const stateSource = readFileSync(path.resolve(__dirname, 'useOwnerProductsPageState.ts'), 'utf8')

describe('useOwnerProductsPageState', () => {
  it('keeps owner product page business actions in a composable instead of index.vue', () => {
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    expect(state.viewModel.value.products).toEqual([])
    expect(state.descriptionFallbackText).toBe('暂无商品简介')
    expect(typeof state.openDescriptionEditor).toBe('function')
    expect(typeof state.openSkuInventory).toBe('function')
    expect(typeof state.publishReadyProducts).toBe('function')
  })

  it('keeps page-facing facade calls outside the Vue page shell', () => {
    expect(pageSource).toContain("import { useOwnerProductsPageState } from './useOwnerProductsPageState'")
    expect(pageSource).not.toContain("from '../../../features/cloudbase-mall/owner-products'")
    expect(stateSource).toContain("from '../../../features/cloudbase-mall/owner-products'")
    expect(stateSource).not.toContain('mallRepository')
    expect(stateSource).not.toContain('mockDb')
  })
})
