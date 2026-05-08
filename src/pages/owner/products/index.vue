<template>
  <view class="page">
    <text class="title">商品管理</text>

    <view class="tabs">
      <button
        v-for="option in statusOptions"
        :key="option.value"
        size="mini"
        :class="{ active: selectedStatus === option.value }"
        @tap="selectedStatus = option.value"
      >
        {{ option.label }}
      </button>
    </view>

    <button class="primary" :disabled="readyProducts.length === 0" @tap="publishReadyProducts">
      批量上架可上架商品
    </button>

    <view v-for="product in filteredProducts" :key="product.id" class="card">
      <image v-if="product.mainImageUrl" class="thumb" :src="product.mainImageUrl" mode="aspectFill" />
      <text class="name">{{ product.productCode }} {{ product.productName }}</text>
      <text>状态：{{ statusText[product.status] }}</text>
      <text>SKU：{{ countSkus(product.id) }} 个</text>
      <button v-if="product.status === 'ready_to_publish'" @tap="publish(product.id)">上架</button>
    </view>

    <text v-if="filteredProducts.length === 0" class="empty">当前筛选下暂无商品</text>
    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { ProductStatus } from '../../../domain/catalog/types'
import { mallWorkflow } from '../../../features/mall-workflow/mall-workflow'
import { mallAccess } from '../../../features/mall-workflow/mall-access'

type StatusFilter = 'all' | ProductStatus

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: '全部', value: 'all' },
  { label: '待补图', value: 'pending_images' },
  { label: '可上架', value: 'ready_to_publish' },
  { label: '已上架', value: 'published' },
]

const statusText: Record<ProductStatus, string> = {
  pending_images: '待补图',
  ready_to_publish: '可上架',
  published: '已上架',
}

const version = ref(0)
const selectedStatus = ref<StatusFilter>('all')
const message = ref('')

onShow(() => {
  version.value += 1
})

const products = computed(() => {
  version.value
  return mallAccess.listProducts()
})

const filteredProducts = computed(() =>
  selectedStatus.value === 'all' ? products.value : products.value.filter((product) => product.status === selectedStatus.value),
)

const readyProducts = computed(() => products.value.filter((product) => product.status === 'ready_to_publish'))

const countSkus = (productId: string) => mallAccess.countSkus(productId)

const publish = (productId: string) => {
  const product = mallAccess.getProduct(productId)
  if (!product) return
  const nextProduct = mallWorkflow.publishProduct(product)
  message.value = nextProduct.status === 'published' ? `${nextProduct.productCode} 已上架` : `${nextProduct.productCode} 暂不可上架`
  version.value += 1
}

const publishReadyProducts = () => {
  readyProducts.value.forEach((product) => {
    mallWorkflow.publishProduct(product)
  })
  message.value = `已上架 ${readyProducts.value.length} 个商品`
  version.value += 1
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx;
  background: #f6f7f9;
}

.title {
  display: block;
  margin-bottom: 24rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.active {
  color: #ffffff;
  background: #0f62fe;
}

.primary {
  margin-bottom: 24rpx;
  color: #ffffff;
  background: #0f62fe;
}

.card,
.result {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 8rpx;
}

.thumb {
  width: 100%;
  height: 260rpx;
  border-radius: 8rpx;
  background: #eef0f3;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
}

.empty {
  color: #576071;
}
</style>
