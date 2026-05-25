import { onMounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'

import { redirectTo } from '../../../app/navigation'
import type { AppRoute } from '../../../app/routes'
import { routes } from '../../../app/routes'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import type {
  OwnerProductStatusFilter,
  OwnerProductSkuInventoryViewModel,
  OwnerProductsViewModel,
} from '../../../features/owner-products/owner-products'
import {
  clearCloudBaseOwnerProductSkuStock,
  getCloudBaseOwnerProductsView,
  getCloudBaseOwnerProductSkuInventoryView,
  publishCloudBaseOwnerProduct,
  publishReadyCloudBaseOwnerProducts,
  restockCloudBaseOwnerProductSkus,
  updateCloudBaseOwnerProductSku,
  updateCloudBaseOwnerProductDescription,
} from '../../../features/cloudbase-mall/owner-products'

type SkuDraft = {
  id: string
  spec: string
  salePriceText: string
  stockText: string
}

const DEFAULT_PAGE_TOP_PADDING = 'calc(env(safe-area-inset-top) + 12rpx)'
const TOP_CONTENT_GAP_RPX = 12

const createEmptyProductsView = (): OwnerProductsViewModel => ({
  statusOptions: [],
  products: [],
  canBatchPublish: false,
  readyProductCount: 0,
  emptyMessage: '当前筛选下暂无商品',
})

const createEmptySkuInventoryView = (): OwnerProductSkuInventoryViewModel => ({
  product: null,
  skus: [],
  reasonOptions: [],
  emptyMessage: '当前商品暂无规格',
})

export const useOwnerProductsPageState = (options: { registerLifecycle?: boolean } = {}) => {
  const { registerLifecycle = true } = options
  const selectedStatus = ref<OwnerProductStatusFilter>('all')
  const pageTopPadding = ref(DEFAULT_PAGE_TOP_PADDING)
  const message = ref('')
  const navigatingRoute = ref<AppRoute | ''>('')
  const publishingProductId = ref('')
  const isBatchPublishing = ref(false)
  const editingProductId = ref('')
  const descriptionDraft = ref('')
  const isSavingDescription = ref(false)
  const inventoryProductId = ref('')
  const isLoadingSkuInventory = ref(false)
  const isSavingSkuInventory = ref(false)
  const restockQuantityText = ref('1')
  const inventoryReason = ref('盘点修正')
  const descriptionFallbackText = '暂无商品简介'
  const viewModel = ref<OwnerProductsViewModel>(createEmptyProductsView())
  const skuInventoryView = ref<OwnerProductSkuInventoryViewModel>(createEmptySkuInventoryView())
  const skuDrafts = ref<SkuDraft[]>([])

  const stayProducts = () => {
    uni.pageScrollTo({ scrollTop: 0, duration: 180 })
  }

  const syncPageTopPadding = () => {
    try {
      const systemInfo = uni.getSystemInfoSync()
      const rpxToPx = systemInfo.windowWidth / 750
      const statusBarHeight = systemInfo.statusBarHeight

      if (typeof statusBarHeight === 'number' && Number.isFinite(statusBarHeight) && statusBarHeight > 0) {
        pageTopPadding.value = `${Math.ceil(statusBarHeight + TOP_CONTENT_GAP_RPX * rpxToPx)}px`
      }
    } catch {
      pageTopPadding.value = DEFAULT_PAGE_TOP_PADDING
    }
  }

  const goAdminTab = (route: AppRoute) => {
    if (navigatingRoute.value === route) {
      return
    }

    navigatingRoute.value = route
    redirectTo(route, {
      onComplete: () => {
        navigatingRoute.value = ''
      },
    })
  }

  const refreshView = async () => {
    viewModel.value = await getCloudBaseOwnerProductsView(selectedStatus.value)
  }

  const resetDescriptionEditor = () => {
    editingProductId.value = ''
    descriptionDraft.value = ''
  }

  const resetSkuDrafts = () => {
    skuDrafts.value = skuInventoryView.value.skus.map((sku) => ({
      id: sku.id,
      spec: sku.spec,
      salePriceText: String(sku.salePrice),
      stockText: String(sku.stock),
    }))
  }

  const loadSkuInventory = async (productId: string) => {
    isLoadingSkuInventory.value = true
    try {
      skuInventoryView.value = await getCloudBaseOwnerProductSkuInventoryView(productId)
      resetSkuDrafts()
    } finally {
      isLoadingSkuInventory.value = false
    }
  }

  const resetSkuInventory = () => {
    inventoryProductId.value = ''
    skuInventoryView.value = createEmptySkuInventoryView()
    skuDrafts.value = []
  }

  const openDescriptionEditor = (productId: string, description = '') => {
    resetSkuInventory()
    editingProductId.value = productId
    descriptionDraft.value = description || ''
  }

  const closeDescriptionEditor = () => {
    if (isSavingDescription.value) {
      return
    }

    resetDescriptionEditor()
  }

  const openSkuInventory = (productId: string) => {
    resetDescriptionEditor()
    inventoryProductId.value = productId
    void loadSkuInventory(productId)
  }

  const closeSkuInventory = () => {
    if (isSavingSkuInventory.value) {
      return
    }

    resetSkuInventory()
  }

  const getSkuPreview = (skuId: string) => {
    const sku = skuInventoryView.value.skus.find((item) => item.id === skuId)
    return sku ? `${sku.stockStatusLabel} · ${sku.customerStatusPreview}` : ''
  }

  const saveSkuDraft = async (skuId: string) => {
    const draft = skuDrafts.value.find((item) => item.id === skuId)
    if (!draft || !inventoryProductId.value || isSavingSkuInventory.value) {
      return
    }

    isSavingSkuInventory.value = true
    try {
      const result = await updateCloudBaseOwnerProductSku(inventoryProductId.value, skuId, {
        spec: draft.spec,
        salePrice: Number(draft.salePriceText),
        stock: Number(draft.stockText),
        reason: inventoryReason.value,
      })
      message.value = result.message
      await loadSkuInventory(inventoryProductId.value)
      await refreshView()
    } finally {
      isSavingSkuInventory.value = false
    }
  }

  const restockSkus = async () => {
    if (!inventoryProductId.value || isSavingSkuInventory.value) {
      return
    }

    isSavingSkuInventory.value = true
    try {
      const result = await restockCloudBaseOwnerProductSkus(
        inventoryProductId.value,
        Number(restockQuantityText.value),
        inventoryReason.value,
      )
      message.value = result.message
      await loadSkuInventory(inventoryProductId.value)
      await refreshView()
    } finally {
      isSavingSkuInventory.value = false
    }
  }

  const clearSkuStock = async () => {
    if (!inventoryProductId.value || isSavingSkuInventory.value) {
      return
    }

    isSavingSkuInventory.value = true
    try {
      const result = await clearCloudBaseOwnerProductSkuStock(inventoryProductId.value, inventoryReason.value)
      message.value = result.message
      await loadSkuInventory(inventoryProductId.value)
      await refreshView()
    } finally {
      isSavingSkuInventory.value = false
    }
  }

  const saveDescription = async () => {
    if (!editingProductId.value || isSavingDescription.value) {
      return
    }

    isSavingDescription.value = true

    try {
      const result = await updateCloudBaseOwnerProductDescription(editingProductId.value, descriptionDraft.value)
      message.value = result.message
      if (result.message === '商品简介已保存') {
        resetDescriptionEditor()
        await refreshView()
      }
    } finally {
      isSavingDescription.value = false
    }
  }

  const publish = async (productId: string) => {
    if (publishingProductId.value || isBatchPublishing.value) {
      return
    }

    publishingProductId.value = productId

    try {
      const result = await publishCloudBaseOwnerProduct(productId)
      message.value = result.message
      await refreshView()
    } finally {
      publishingProductId.value = ''
    }
  }

  const publishReadyProducts = async () => {
    if (isBatchPublishing.value || publishingProductId.value) {
      return
    }

    isBatchPublishing.value = true

    try {
      const result = await publishReadyCloudBaseOwnerProducts()
      message.value = result.message
      await refreshView()
    } finally {
      isBatchPublishing.value = false
    }
  }

  if (registerLifecycle) {
    onMounted(syncPageTopPadding)

    onShow(() => {
      navigatingRoute.value = ''

      if (!ensureAdminWorkbenchSession('productManagement')) {
        return
      }

      void refreshView()
    })

    watch(selectedStatus, () => {
      void refreshView()
    })
  }

  return {
    routes,
    selectedStatus,
    pageTopPadding,
    message,
    navigatingRoute,
    publishingProductId,
    isBatchPublishing,
    editingProductId,
    descriptionDraft,
    isSavingDescription,
    inventoryProductId,
    isLoadingSkuInventory,
    isSavingSkuInventory,
    restockQuantityText,
    inventoryReason,
    descriptionFallbackText,
    viewModel,
    skuInventoryView,
    skuDrafts,
    stayProducts,
    goAdminTab,
    refreshView,
    openDescriptionEditor,
    resetDescriptionEditor,
    closeDescriptionEditor,
    openSkuInventory,
    resetSkuInventory,
    closeSkuInventory,
    getSkuPreview,
    saveSkuDraft,
    restockSkus,
    clearSkuStock,
    saveDescription,
    publish,
    publishReadyProducts,
  }
}
