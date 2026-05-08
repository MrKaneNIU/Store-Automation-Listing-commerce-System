<template>
  <view class="page">
    <text class="title">老板工作台</text>
    <view class="grid">
      <button @tap="navigateTo(routes.ownerImportUpload)">批量截图识别</button>
      <button @tap="navigateTo(routes.ownerDraftReview)">草稿确认</button>
      <button @tap="navigateTo(routes.ownerProducts)">商品管理</button>
      <button @tap="navigateTo(routes.ownerOrders)">订单确认</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { navigateTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 32rpx;
  background: #f6f7f9;
}

.title {
  display: block;
  margin-bottom: 28rpx;
  font-size: 40rpx;
  font-weight: 700;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}
</style>
