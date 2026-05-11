<template>
  <view class="page">
    <text class="title">商品列表</text>
    <text class="hint">客户侧只展示已上架商品。</text>

    <view v-for="product in products" :key="product.id" class="card" @tap="openDetail(product.id)">
      <image v-if="product.mainImageUrl" class="image" :src="product.mainImageUrl" mode="aspectFill" />
      <text class="name">{{ product.productName }}</text>
      <text class="code">货号：{{ product.productCode }}</text>
      <text class="price">￥{{ product.minPrice }}</text>
    </view>

    <text v-if="products.length === 0" class="empty">暂无已上架商品</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { CustomerProductListItem } from '../../../features/customer-product-list/customer-product-list'
import { getCloudBaseCustomerProductListView } from '../../../features/cloudbase-mall/customer-product-list'

const products = ref<CustomerProductListItem[]>([])

const refreshView = async () => {
  products.value = (await getCloudBaseCustomerProductListView()).products
}

onShow(() => {
  void refreshView()
})

const openDetail = (productId: string) => {
  uni.navigateTo({ url: `/pages/customer/product-detail/index?id=${productId}` })
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
  margin-bottom: 12rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.hint,
.empty {
  display: block;
  margin-bottom: 24rpx;
  color: #576071;
}

.card {
  margin-bottom: 20rpx;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 8rpx;
}

.image {
  width: 100%;
  height: 320rpx;
  margin-bottom: 18rpx;
  border-radius: 8rpx;
  background: #eef0f3;
}

.name {
  display: block;
  font-weight: 600;
}

.code,
.price {
  display: block;
  margin-top: 8rpx;
  color: #576071;
}
</style>
