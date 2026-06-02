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
  updateCloudBaseOwnerProductBasics: vi.fn(),
  updateCloudBaseOwnerProductDescription: vi.fn(),
  updateCloudBaseOwnerProductSku: vi.fn(),
}))

vi.mock('../../../features/cloudbase-mall/owner-products', () => ownerProductFeatureMocks)

import { useOwnerProductsPageState } from './useOwnerProductsPageState'

const pageSource = readFileSync(path.resolve(__dirname, 'index.vue'), 'utf8')
const stateSource = readFileSync(path.resolve(__dirname, 'useOwnerProductsPageState.ts'), 'utf8')

const createOwnerProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'product-1',
  productCode: 'A1023',
  productName: 'Cotton Shirt',
  description: '',
  status: 'published' as const,
  statusLabel: 'published',
  mainImageUrl: '/static/logo.png',
  durableMainImageUrl: '/static/logo.png',
  thumbnailUrl: '/static/logo.png',
  imageStatus: 'ready' as const,
  imageAlt: 'Cotton Shirt',
  imageUrls: [],
  createdFromBatchId: 'batch-1',
  createdAt: '2026-05-09T00:00:00.000Z',
  updatedAt: '2026-05-09T00:00:00.000Z',
  skuCount: 1,
  canPublish: false,
  publishBlockReasons: [],
  ...overrides,
})

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
    expect(typeof state.openProductEditor).toBe('function')
    expect(typeof state.saveProductBasics).toBe('function')
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

  it('uses one unified edit entry and keeps core productCode read-only', () => {
    expect(pageSource).toContain('@tap="openProductEditor(product)"')
    expect(pageSource).toContain('编辑商品')
    expect(pageSource).toContain('v-model="productNameDraft"')
    expect(pageSource).toContain('v-model="productCodeReadonly"')
    expect(pageSource).toContain('disabled')
    expect(pageSource).toContain('货号是 SPU/SKU 关联标识')
    expect(pageSource).not.toContain('编辑简介')
    expect(pageSource).not.toContain('@tap="openDescriptionEditor')
    expect(pageSource).not.toContain('@tap="openSkuInventory')
  })

  it('renders already-normalized owner product image urls without reblocking signed temp render urls', () => {
    expect(pageSource).toContain('v-if="product.mainImageUrl"')
    expect(pageSource).toContain(':src="product.mainImageUrl"')
    expect(pageSource).toContain('@error="handleProductImageError(product.id)"')
    expect(pageSource).toContain('product.imageStatus')
    expect(stateSource).toContain('handleProductImageError')
    expect(pageSource).not.toContain('isRenderableOwnerProductImageUrl(product.mainImageUrl)')
    expect(stateSource).not.toContain('isRenderableOwnerProductImageUrl')
  })

  it('refreshes owner product images once after an image load failure', async () => {
    ownerProductFeatureMocks.getCloudBaseOwnerProductsView
      .mockResolvedValueOnce({
        statusOptions: [],
        products: [createOwnerProduct({
          mainImageUrl: 'https://stale.example/product.jpg',
          durableMainImageUrl: 'cloud://asset-main',
          thumbnailUrl: 'https://stale.example/product.jpg',
        })],
        canBatchPublish: false,
        readyProductCount: 0,
        emptyMessage: '',
      })
      .mockResolvedValueOnce({
        statusOptions: [],
        products: [createOwnerProduct({
          mainImageUrl: 'https://fresh.example/product.jpg',
          durableMainImageUrl: 'cloud://asset-main',
          thumbnailUrl: 'https://fresh.example/product.jpg',
        })],
        canBatchPublish: false,
        readyProductCount: 0,
        emptyMessage: '',
      })
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    await state.refreshView()
    await state.handleProductImageError('product-1')

    expect(ownerProductFeatureMocks.getCloudBaseOwnerProductsView).toHaveBeenCalledTimes(2)
    expect(state.viewModel.value.products[0].mainImageUrl).toBe('https://fresh.example/product.jpg')
    expect(state.message.value).toBe('商品图片加载失败，已尝试刷新图片链接')
  })

  it('prefills and saves unified product basics without productCode mutation', async () => {
    ownerProductFeatureMocks.getCloudBaseOwnerProductSkuInventoryView.mockResolvedValueOnce({
      product: createOwnerProduct(),
      skus: [],
      reasonOptions: [],
      emptyMessage: 'empty',
    })
    ownerProductFeatureMocks.updateCloudBaseOwnerProductBasics.mockResolvedValueOnce({
      message: '商品基础信息已保存',
    })
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    state.openProductEditor(createOwnerProduct())
    state.productNameDraft.value = 'Updated Cotton Shirt'
    state.productCodeReadonly.value = 'SHOULD-NOT-SAVE'
    state.descriptionDraft.value = 'new copy'
    await state.saveProductBasics()

    expect(ownerProductFeatureMocks.updateCloudBaseOwnerProductBasics).toHaveBeenCalledWith('product-1', {
      productName: 'Updated Cotton Shirt',
      description: 'new copy',
    })
    expect(JSON.stringify(ownerProductFeatureMocks.updateCloudBaseOwnerProductBasics.mock.calls)).not.toContain('SHOULD-NOT-SAVE')
    expect(ownerProductFeatureMocks.getCloudBaseOwnerProductsView).toHaveBeenCalled()
  })

  it('shows a visible failure message when saving product basics fails', async () => {
    ownerProductFeatureMocks.updateCloudBaseOwnerProductBasics.mockRejectedValueOnce(
      new Error('action updateProductBasics is not supported'),
    )
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    state.openProductEditor(createOwnerProduct({ description: 'old copy' }))
    state.productNameDraft.value = 'Updated Cotton Shirt'
    state.descriptionDraft.value = 'new copy'

    await expect(state.saveProductBasics()).resolves.toBeUndefined()

    expect(state.message.value).toBe('保存商品基础信息失败：action updateProductBasics is not supported')
    expect(state.editingProductId.value).toBe('product-1')
    expect(state.isSavingProductBasics.value).toBe(false)
  })

  it('shows a visible failure message when saving sku inventory fails', async () => {
    ownerProductFeatureMocks.updateCloudBaseOwnerProductSku.mockRejectedValueOnce(new Error('action updateSku is not supported'))
    const state = useOwnerProductsPageState({ registerLifecycle: false })

    state.inventoryProductId.value = 'product-1'
    state.skuDrafts.value = [{
      id: 'sku-1',
      spec: 'M',
      salePriceText: '12',
      stockText: '8',
    }]

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
        createOwnerProduct({ id: 'product-1', status: 'published', statusLabel: '已上架' }),
        createOwnerProduct({
          id: 'product-2',
          productCode: 'A1024',
          productName: 'Linen Shirt',
          status: 'pending_images',
          statusLabel: '待补图',
          mainImageUrl: '',
          durableMainImageUrl: '',
          thumbnailUrl: '',
          imageStatus: 'missing',
          publishBlockReasons: ['商品主图不能为空'],
        }),
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
    expect(state.message.value).toContain('Verified WeChat identity is required')
  })
})
