import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const ownerProductFeatureMocks = vi.hoisted(() => ({
  clearCloudBaseOwnerProductSkuStock: vi.fn(),
  deleteCloudBaseOwnerProduct: vi.fn(),
  getCloudBaseOwnerProductSkuInventoryView: vi.fn(),
  getCloudBaseOwnerProductsView: vi.fn(),
  publishCloudBaseOwnerProduct: vi.fn(),
  publishReadyCloudBaseOwnerProducts: vi.fn(),
  restockCloudBaseOwnerProductSkus: vi.fn(),
  unpublishCloudBaseOwnerProduct: vi.fn(),
  updateCloudBaseOwnerProductDescription: vi.fn(),
  updateCloudBaseOwnerProductSku: vi.fn(),
}))

vi.mock('../../../features/cloudbase-mall/owner-products', () => ownerProductFeatureMocks)

import { isRenderableOwnerProductImageUrl, useOwnerProductsPageState } from './useOwnerProductsPageState'

const pageSource = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const stateSource = readFileSync(path.resolve(__dirname, 'useOwnerProductsPageState.ts'), 'utf8')

describe('useOwnerProductsPageState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('uni', {
      showModal: (options: { success: (result: { confirm: boolean }) => void }) => {
        options.success({ confirm: true })
      },
    })
    ownerProductFeatureMocks.getCloudBaseOwnerProductsView.mockResolvedValue({
      statusOptions: [],
      products: [],
      canBatchPublish: false,
      readyProductCount: 0,
      emptyMessage: 'empty',
    })
    ownerProductFeatureMocks.getCloudBaseOwnerProductSkuInventoryView.mockResolvedValue({
      product: null,
      skus: [],
      reasonOptions: [],
      emptyMessage: 'empty',
    })
  })

  it('keeps owner product page business actions in a composable instead of index.vue', () => {
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    expect(state.viewModel.value.products).toEqual([])
    expect(state.descriptionFallbackText).toBe('暂无商品简介')
    expect(typeof state.openDescriptionEditor).toBe('function')
    expect(typeof state.openSkuInventory).toBe('function')
    expect(typeof state.publishReadyProducts).toBe('function')
    expect(typeof state.unpublishProduct).toBe('function')
    expect(typeof state.deleteProduct).toBe('function')
  })

  it('keeps page-facing facade calls outside the Vue page shell', () => {
    expect(pageSource).toContain("import { useOwnerProductsPageState } from './useOwnerProductsPageState'")
    expect(pageSource).not.toContain("from '../../../features/cloudbase-mall/owner-products'")
    expect(stateSource).toContain("from '../../../features/cloudbase-mall/owner-products'")
    expect(stateSource).not.toContain('mallRepository')
    expect(stateSource).not.toContain('mockDb')
    expect(stateSource).toContain('uni.showModal')
    expect(stateSource).toContain("confirmText: '删除'")
  })

  it('blocks CloudBase signed temporary image URLs before owner product image rendering', () => {
    const signedTempUrl = 'https://636c-cloud1-d7gifjyzl7721b383-1429982088.tcb.qcloud.la/uploads/product.jpg?sign=abc&t=1779673154'

    expect(isRenderableOwnerProductImageUrl(signedTempUrl)).toBe(false)
    expect(isRenderableOwnerProductImageUrl('cloud://asset-1')).toBe(true)
    expect(isRenderableOwnerProductImageUrl('/static/logo.png')).toBe(true)
    expect(pageSource).toContain('isRenderableOwnerProductImageUrl(product.mainImageUrl)')
  })

  it('shows a visible failure message when saving product description fails', async () => {
    ownerProductFeatureMocks.updateCloudBaseOwnerProductDescription.mockRejectedValueOnce(
      new Error('action updateProductDescription is not supported'),
    )
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    state.openDescriptionEditor('product-1', 'old copy')
    state.descriptionDraft.value = 'new copy'

    await expect(state.saveDescription()).resolves.toBeUndefined()

    expect(state.message.value).toBe('保存商品简介失败：action updateProductDescription is not supported')
    expect(state.editingProductId.value).toBe('product-1')
    expect(state.isSavingDescription.value).toBe(false)
  })

  it('shows a visible failure message when saving sku inventory fails', async () => {
    ownerProductFeatureMocks.updateCloudBaseOwnerProductSku.mockRejectedValueOnce(new Error('action updateSku is not supported'))
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    state.inventoryProductId.value = 'product-1'
    state.skuDrafts.value = [
      {
        id: 'sku-1',
        spec: 'M',
        salePriceText: '12',
        stockText: '8',
      },
    ]

    await expect(state.saveSkuDraft('sku-1')).resolves.toBeUndefined()

    expect(state.message.value).toBe('保存规格库存失败：action updateSku is not supported')
    expect(state.isSavingSkuInventory.value).toBe(false)
  })

  it('shows a visible failure message when unpublishing a product fails', async () => {
    ownerProductFeatureMocks.unpublishCloudBaseOwnerProduct.mockRejectedValueOnce(new Error('action unpublishProduct is not supported'))
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    await expect(state.unpublishProduct('product-1')).resolves.toBeUndefined()

    expect(state.message.value).toBe('下架商品失败：action unpublishProduct is not supported')
    expect(state.lifecycleProductId.value).toBe('')
  })

  it('shows a visible failure message when deleting a product fails', async () => {
    ownerProductFeatureMocks.deleteCloudBaseOwnerProduct.mockRejectedValueOnce(new Error('action deleteProduct is not supported'))
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    await expect(state.deleteProduct('product-1', 'P-001')).resolves.toBeUndefined()

    expect(state.message.value).toBe('删除商品失败：action deleteProduct is not supported')
    expect(state.lifecycleProductId.value).toBe('')
  })

  it('filters product status tabs locally after one remote refresh', async () => {
    ownerProductFeatureMocks.getCloudBaseOwnerProductsView.mockResolvedValueOnce({
      statusOptions: [
        { label: '全部', value: 'all' },
        { label: '待补图', value: 'pending_images' },
        { label: '已上架', value: 'published' },
      ],
      products: [
        {
          id: 'product-1',
          productCode: 'A1023',
          productName: 'Cotton Shirt',
          description: '',
          status: 'published',
          statusLabel: '已上架',
          mainImageUrl: '/static/logo.png',
          imageUrls: [],
          createdFromBatchId: 'batch-1',
          createdAt: '2026-05-09T00:00:00.000Z',
          updatedAt: '2026-05-09T00:00:00.000Z',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: [],
        },
        {
          id: 'product-2',
          productCode: 'A1024',
          productName: 'Linen Shirt',
          description: '',
          status: 'pending_images',
          statusLabel: '待补图',
          mainImageUrl: '',
          imageUrls: [],
          createdFromBatchId: 'batch-1',
          createdAt: '2026-05-09T00:00:00.000Z',
          updatedAt: '2026-05-09T00:00:00.000Z',
          skuCount: 1,
          canPublish: false,
          publishBlockReasons: ['商品主图不能为空'],
        },
      ],
      canBatchPublish: false,
      readyProductCount: 0,
      emptyMessage: '当前筛选下暂无商品',
    })
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    await state.refreshView()
    state.selectedStatus.value = 'published'
    await nextTick()

    expect(ownerProductFeatureMocks.getCloudBaseOwnerProductsView).toHaveBeenCalledTimes(1)
    expect(state.viewModel.value.products).toEqual([
      expect.objectContaining({ id: 'product-1', status: 'published' }),
    ])
  })

  it('shows a visible failure state when the first owner product refresh is rejected', async () => {
    ownerProductFeatureMocks.getCloudBaseOwnerProductsView.mockRejectedValueOnce(
      new Error('Verified WeChat identity is required'),
    )
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    await expect(state.refreshView()).resolves.toBeUndefined()

    expect(state.viewModel.value.products).toEqual([])
    expect(state.viewModel.value.emptyMessage).toBe('商品管理加载失败，请重新登录或稍后重试')
    expect(state.message.value).toBe('商品管理加载失败：Verified WeChat identity is required')
  })
})
