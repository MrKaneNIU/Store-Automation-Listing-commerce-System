<template>
  <view class="page" :style="{ paddingTop: pageTopPadding }">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">MERCHANDISE ROOM</text>
        <text class="title">商品管理</text>
      </view>
    </view>

    <view class="hero">
      <view class="hero-copy">
        <text class="hero-label">PUBLISH QUEUE</text>
        <text class="hero-title">{{ viewModel.readyProductCount }} 件待上架</text>
        <text class="hero-desc">状态筛选、单品上架和批量上架均沿用现有商品发布链路。</text>
      </view>
    </view>

    <view class="filter-panel">
      <view class="filter-head">
        <text class="section-title">状态筛选</text>
        <text class="section-meta">{{ viewModel.products.length }} 件</text>
      </view>
      <view class="tabs">
        <button
          v-for="option in viewModel.statusOptions"
          :key="option.value"
          class="filter-pill"
          :class="{ 'filter-pill-active': selectedStatus === option.value }"
          @tap="selectedStatus = option.value"
        >
          {{ option.label }}
        </button>
      </view>
    </view>

    <view class="publish-strip">
      <view class="publish-copy">
        <text class="publish-title">批量上架可上架商品</text>
        <text class="publish-meta">当前可上架 {{ viewModel.readyProductCount }} 件</text>
      </view>
      <button
        class="primary"
        :class="{ busy: isBatchPublishing }"
        :disabled="!viewModel.canBatchPublish || isBatchPublishing || Boolean(publishingProductId)"
        hover-class="press-feedback"
        @tap="publishReadyProducts"
      >
        {{ isBatchPublishing ? '上架中...' : '批量上架' }}
      </button>
    </view>

    <view v-if="viewModel.products.length > 0" class="product-list">
      <view v-for="product in viewModel.products" :key="product.id" class="product-card">
        <view class="image-shell">
          <image v-if="product.mainImageUrl" class="thumb" :src="product.mainImageUrl" mode="aspectFill" />
          <view v-else class="image-placeholder">
            <text class="placeholder-text">NO IMAGE</text>
          </view>
          <text class="status-badge">{{ product.statusLabel }}</text>
        </view>

        <view class="product-copy">
          <text class="code">货号 {{ product.productCode }}</text>
          <text class="name">{{ product.productName }}</text>
          <text class="description-summary">{{ product.description || descriptionFallbackText }}</text>
          <view v-if="product.publishBlockReasons.length > 0" class="publish-issues">
            <text v-for="reason in product.publishBlockReasons" :key="reason" class="publish-issue">
              {{ reason }}
            </text>
          </view>
          <view class="product-foot">
            <text class="sku-count">SKU {{ product.skuCount }} 个</text>
            <view class="product-actions">
              <button class="description-button" hover-class="press-feedback" @tap="openDescriptionEditor(product.id, product.description || '')">
                编辑简介
              </button>
              <button class="sku-button" hover-class="press-feedback" @tap="openSkuInventory(product.id)">
                规格库存
              </button>
              <button
                v-if="product.canPublish"
                class="publish-button"
                :class="{ busy: publishingProductId === product.id }"
                :disabled="Boolean(publishingProductId) || isBatchPublishing"
                hover-class="press-feedback"
                @tap="publish(product.id)"
              >
                {{ publishingProductId === product.id ? '上架中...' : '上架' }}
              </button>
              <text v-else class="published-mark">已处理</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-title">{{ viewModel.emptyMessage }}</text>
      <text class="empty-copy">切换状态筛选后，可继续查看其它商品队列。</text>
    </view>

    <view v-if="message" class="result">{{ message }}</view>

    <view v-if="editingProductId" class="modal-layer">
      <view class="modal-sheet">
        <view class="modal-head">
          <view class="modal-title-group">
            <text class="modal-kicker">PRODUCT COPY</text>
            <text class="modal-title">编辑简介</text>
          </view>
          <button class="modal-close" aria-label="关闭简介编辑" @tap="closeDescriptionEditor">
            <text>×</text>
          </button>
        </view>
        <textarea
          v-model="descriptionDraft"
          class="description-input"
          maxlength="120"
          auto-height
          placeholder="请输入商品简介"
        />
        <view class="modal-foot">
          <text class="count-text">{{ descriptionDraft.length }}/120</text>
          <button class="save-button" :disabled="isSavingDescription" hover-class="press-feedback" @tap="saveDescription">
            {{ isSavingDescription ? '保存中...' : '保存' }}
          </button>
        </view>
      </view>
    </view>

    <view v-if="inventoryProductId" class="modal-layer">
      <view class="modal-sheet inventory-sheet">
        <view class="modal-head">
          <view class="modal-title-group">
            <text class="modal-kicker">SKU INVENTORY</text>
            <text class="modal-title">规格库存</text>
          </view>
          <button class="modal-close" aria-label="关闭规格库存" @tap="closeSkuInventory">
            <text>×</text>
          </button>
        </view>

        <view class="inventory-summary">
          <text class="inventory-product">{{ skuInventoryView.product?.productName || '商品规格' }}</text>
          <text class="inventory-meta">{{ skuInventoryView.skus.length }} 个规格，库存调整会写入流水</text>
        </view>

        <view class="batch-tools">
          <view class="field-block compact-field">
            <text class="field-label">补货数量</text>
            <input v-model="restockQuantityText" class="inventory-input" type="number" />
          </view>
          <view class="field-block reason-field">
            <text class="field-label">调整原因</text>
            <input v-model="inventoryReason" class="inventory-input" />
          </view>
          <view class="batch-actions">
            <button class="restock-button" :disabled="isSavingSkuInventory" hover-class="press-feedback" @tap="restockSkus">
              补货
            </button>
            <button class="clear-button" :disabled="isSavingSkuInventory" hover-class="press-feedback" @tap="clearSkuStock">
              清零
            </button>
          </view>
        </view>

        <view v-if="skuDrafts.length > 0" class="sku-table">
          <view v-for="draft in skuDrafts" :key="draft.id" class="sku-row">
            <view class="sku-row-head">
              <text class="sku-id">SKU {{ draft.id }}</text>
              <text class="sku-preview">{{ getSkuPreview(draft.id) }}</text>
            </view>
            <view class="sku-fields">
              <view class="field-block">
                <text class="field-label">规格名</text>
                <input v-model="draft.spec" class="inventory-input" />
              </view>
              <view class="field-grid">
                <view class="field-block">
                  <text class="field-label">售价</text>
                  <input v-model="draft.salePriceText" class="inventory-input" type="digit" />
                </view>
                <view class="field-block">
                  <text class="field-label">库存</text>
                  <input v-model="draft.stockText" class="inventory-input" type="number" />
                </view>
              </view>
            </view>
            <button class="save-sku-button" :disabled="isSavingSkuInventory" hover-class="press-feedback" @tap="saveSkuDraft(draft.id)">
              保存规格
            </button>
          </view>
        </view>

        <view v-else class="sku-empty">
          <text>{{ isLoadingSkuInventory ? '规格加载中...' : skuInventoryView.emptyMessage }}</text>
        </view>
      </view>
    </view>

    <view class="admin-nav">
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerDashboard }"
        :disabled="navigatingRoute === routes.ownerDashboard"
        @tap="goAdminTab(routes.ownerDashboard)"
      >
        工作台
      </button>
      <button class="nav-item active" @tap="stayProducts">商品管理</button>
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerOrders }"
        :disabled="navigatingRoute === routes.ownerOrders"
        @tap="goAdminTab(routes.ownerOrders)"
      >
        订单确认
      </button>
      <button
        class="nav-item"
        :class="{ busy: navigatingRoute === routes.ownerMore }"
        :disabled="navigatingRoute === routes.ownerMore"
        @tap="goAdminTab(routes.ownerMore)"
      >
        更多
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { redirectTo } from '../../../app/navigation'
import type { AppRoute } from '../../../app/routes'
import { routes } from '../../../app/routes'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import {
  type OwnerProductStatusFilter,
  type OwnerProductSkuInventoryViewModel,
  type OwnerProductsViewModel,
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

const selectedStatus = ref<OwnerProductStatusFilter>('all')
const DEFAULT_PAGE_TOP_PADDING = 'calc(env(safe-area-inset-top) + 12rpx)'
const TOP_CONTENT_GAP_RPX = 12

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
const viewModel = ref<OwnerProductsViewModel>({
  statusOptions: [],
  products: [],
  canBatchPublish: false,
  readyProductCount: 0,
  emptyMessage: '当前筛选下暂无商品',
})
const skuInventoryView = ref<OwnerProductSkuInventoryViewModel>({
  product: null,
  skus: [],
  reasonOptions: [],
  emptyMessage: '当前商品暂无规格',
})
const skuDrafts = ref<Array<{
  id: string
  spec: string
  salePriceText: string
  stockText: string
}>>([])

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

onMounted(syncPageTopPadding)

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

const openDescriptionEditor = (productId: string, description = '') => {
  resetSkuInventory()
  editingProductId.value = productId
  descriptionDraft.value = description || ''
}

const resetDescriptionEditor = () => {
  editingProductId.value = ''
  descriptionDraft.value = ''
}

const closeDescriptionEditor = () => {
  if (isSavingDescription.value) {
    return
  }

  resetDescriptionEditor()
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

const openSkuInventory = (productId: string) => {
  resetDescriptionEditor()
  inventoryProductId.value = productId
  void loadSkuInventory(productId)
}

const resetSkuInventory = () => {
  inventoryProductId.value = ''
  skuInventoryView.value = {
    product: null,
    skus: [],
    reasonOptions: [],
    emptyMessage: '当前商品暂无规格',
  }
  skuDrafts.value = []
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
    const result = await restockCloudBaseOwnerProductSkus(inventoryProductId.value, Number(restockQuantityText.value), inventoryReason.value)
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
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 12rpx) 32rpx calc(188rpx + env(safe-area-inset-bottom));
  background: #f8f8f8;
  color: #202020;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 34rpx;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.kicker {
  color: #8e8e8e;
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1.2;
}

.title {
  color: #202020;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
  white-space: nowrap;
}

.filter-pill::after,
.primary::after,
.description-button::after,
.sku-button::after,
.publish-button::after,
.restock-button::after,
.clear-button::after,
.save-sku-button::after,
.save-button::after,
.modal-close::after,
.nav-item::after {
  border: 0;
}

.hero {
  box-sizing: border-box;
  margin-bottom: 24rpx;
  padding: 34rpx;
  border-radius: 34rpx;
  background: #202020;
  color: #ffffff;
  box-shadow: 0 24rpx 60rpx rgba(10, 10, 10, 0.12);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hero-label {
  margin-bottom: 18rpx;
  color: #b8b8b8;
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1.2;
}

.hero-title {
  margin-bottom: 18rpx;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.hero-desc {
  max-width: 430rpx;
  color: #d7d7d7;
  font-size: 24rpx;
  line-height: 1.55;
}

.filter-panel,
.publish-strip,
.empty-state,
.result {
  box-sizing: border-box;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.filter-panel {
  margin-bottom: 20rpx;
  padding: 28rpx;
}

.filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.section-title {
  color: #202020;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.3;
}

.section-meta {
  flex: 0 0 auto;
  color: #8e8e8e;
  font-size: 24rpx;
  line-height: 1.3;
}

.tabs {
  display: flex;
  gap: 14rpx;
  overflow-x: auto;
  white-space: nowrap;
}

.filter-pill {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 60rpx;
  margin: 0;
  padding: 0 26rpx;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #707070;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 60rpx;
}

.filter-pill-active {
  background: #202020;
  color: #ffffff;
}

.publish-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 26rpx;
  padding: 28rpx 28rpx 28rpx 32rpx;
}

.publish-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.publish-title {
  overflow: hidden;
  color: #202020;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.publish-meta {
  color: #8e8e8e;
  font-size: 24rpx;
  line-height: 1.35;
}

.primary {
  flex: 0 0 auto;
  min-width: 144rpx;
  min-height: 68rpx;
  margin: 0;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #202020;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 68rpx;
  transition: opacity 120ms ease, transform 120ms ease;
}

.primary[disabled] {
  background: #e8e8e8;
  color: #9a9a9a;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.product-card {
  display: grid;
  grid-template-columns: 188rpx minmax(0, 1fr);
  gap: 24rpx;
  box-sizing: border-box;
  padding: 18rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.image-shell {
  position: relative;
  width: 188rpx;
  height: 236rpx;
  overflow: hidden;
  border-radius: 26rpx;
  background: #f0f0f0;
}

.thumb {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 22rpx 12rpx;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.26), rgba(5, 5, 5, 0.08)),
    #f0f0f0;
}

.placeholder-text {
  color: #9a9a9a;
  font-size: 18rpx;
  font-weight: 500;
  line-height: 1;
}

.status-badge {
  position: absolute;
  top: 14rpx;
  left: 14rpx;
  max-width: 132rpx;
  box-sizing: border-box;
  padding: 9rpx 14rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #202020;
  font-size: 20rpx;
  font-weight: 500;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 8rpx 8rpx 8rpx 0;
}

.code {
  margin-bottom: 12rpx;
  overflow: hidden;
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.name {
  display: -webkit-box;
  min-height: 76rpx;
  overflow: hidden;
  color: #202020;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.description-summary {
  display: -webkit-box;
  min-height: 64rpx;
  margin-top: 10rpx;
  overflow: hidden;
  color: #8a8a8a;
  font-size: 24rpx;
  line-height: 1.35;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.publish-issues {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-top: 12rpx;
  margin-bottom: 14rpx;
}

.publish-issue {
  color: #b45309;
  font-size: 22rpx;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.product-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: auto;
}

.sku-count {
  min-width: 0;
  color: #707070;
  font-size: 24rpx;
  line-height: 1.35;
}

.product-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
  max-width: 360rpx;
}

.description-button,
.sku-button,
.publish-button {
  flex: 0 0 auto;
  min-width: 104rpx;
  min-height: 60rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #202020;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 60rpx;
  transition: opacity 120ms ease, transform 120ms ease;
}

.description-button {
  min-width: 132rpx;
  background: #f4f4f4;
  color: #202020;
}

.sku-button {
  min-width: 132rpx;
  background: #f1efe9;
  color: #3f3a32;
}

.published-mark {
  flex: 0 0 auto;
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.35;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  min-height: 360rpx;
  padding: 48rpx 40rpx;
}

.empty-title {
  color: #202020;
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.3;
}

.empty-copy {
  color: #9a9a9a;
  font-size: 26rpx;
  line-height: 1.5;
}

.result {
  display: block;
  margin-top: 22rpx;
  padding: 24rpx 28rpx;
  color: #202020;
  font-size: 26rpx;
  line-height: 1.45;
}

.modal-layer {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  background: rgba(5, 5, 5, 0.45);
}

.modal-sheet {
  box-sizing: border-box;
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  padding: 34rpx 32rpx calc(34rpx + env(safe-area-inset-bottom));
  border-top-left-radius: 36rpx;
  border-top-right-radius: 36rpx;
  background: #ffffff;
}

.inventory-sheet {
  padding-bottom: calc(42rpx + env(safe-area-inset-bottom));
}

.modal-head,
.modal-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.modal-title-group {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.modal-kicker {
  color: #9a9a9a;
  font-size: 22rpx;
  line-height: 1.2;
}

.modal-title {
  color: #202020;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.2;
}

.modal-close {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin: 0;
  padding: 0;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #202020;
}

.modal-close text {
  font-size: 40rpx;
  line-height: 1;
}

.description-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 190rpx;
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 26rpx;
  background: #f8f8f8;
  color: #202020;
  font-size: 28rpx;
  line-height: 1.5;
}

.inventory-summary {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f8f8f8;
}

.inventory-product {
  color: #202020;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.inventory-meta {
  color: #7a7a7a;
  font-size: 24rpx;
  line-height: 1.45;
}

.batch-tools {
  display: grid;
  grid-template-columns: 150rpx minmax(0, 1fr);
  gap: 18rpx;
  margin-top: 22rpx;
}

.field-block {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.compact-field {
  min-width: 0;
}

.reason-field {
  min-width: 0;
}

.field-label {
  color: #7a7a7a;
  font-size: 22rpx;
  line-height: 1.2;
}

.inventory-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 66rpx;
  padding: 0 18rpx;
  border-radius: 18rpx;
  background: #f4f4f4;
  color: #202020;
  font-size: 24rpx;
  line-height: 66rpx;
}

.batch-actions {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.restock-button,
.clear-button,
.save-sku-button {
  min-height: 66rpx;
  margin: 0;
  padding: 0 24rpx;
  border-radius: 22rpx;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 66rpx;
  transition: opacity 120ms ease, transform 120ms ease;
}

.restock-button {
  background: #202020;
  color: #ffffff;
}

.clear-button {
  background: #f4f4f4;
  color: #202020;
}

.restock-button[disabled],
.clear-button[disabled],
.save-sku-button[disabled] {
  opacity: 0.6;
}

.sku-table {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 24rpx;
}

.sku-row {
  box-sizing: border-box;
  padding: 22rpx;
  border: 1rpx solid #ececec;
  border-radius: 26rpx;
  background: #ffffff;
}

.sku-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 18rpx;
}

.sku-id {
  min-width: 0;
  overflow: hidden;
  color: #202020;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sku-preview {
  flex: 0 0 auto;
  color: #7a7a7a;
  font-size: 22rpx;
  line-height: 1.35;
}

.sku-fields {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.save-sku-button {
  width: 100%;
  margin-top: 18rpx;
  background: #202020;
  color: #ffffff;
}

.sku-empty {
  display: flex;
  align-items: center;
  min-height: 160rpx;
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f8f8f8;
  color: #7a7a7a;
  font-size: 24rpx;
  line-height: 1.45;
}

.modal-foot {
  margin-top: 24rpx;
}

.count-text {
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.3;
}

.save-button {
  min-width: 132rpx;
  min-height: 68rpx;
  margin: 0;
  padding: 0 30rpx;
  border-radius: 999rpx;
  background: #202020;
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 500;
  line-height: 68rpx;
}

.save-button[disabled] {
  opacity: 0.6;
}

.admin-nav {
  position: fixed;
  right: 24rpx;
  bottom: calc(20rpx + env(safe-area-inset-bottom));
  left: 24rpx;
  z-index: 8;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
  box-sizing: border-box;
  min-height: 124rpx;
  padding: 12rpx;
  border-radius: 38rpx;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 22rpx 52rpx rgba(12, 12, 12, 0.12);
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 92rpx;
  min-height: 92rpx;
  box-sizing: border-box;
  margin: 0;
  padding: 0 10rpx;
  border-radius: 30rpx;
  background: transparent;
  color: #7a7a7a;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
  transition: opacity 120ms ease, transform 120ms ease;
}

.nav-item.active {
  background: #202020;
  color: #ffffff;
}

.admin-nav .busy {
  transform: none;
}

.busy {
  opacity: 0.66;
  transform: scale(0.98);
}

.press-feedback {
  opacity: 0.72;
  transform: scale(0.98);
}
</style>
