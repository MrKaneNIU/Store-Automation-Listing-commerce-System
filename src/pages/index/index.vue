<template>
  <view class="page">
    <view class="header">
      <text class="eyebrow">服装商城 MVP</text>
      <text class="title">VX Close System</text>
      <text class="subtitle">围绕云 e 宝截图识别、商品草稿、补图、上架和订单确认构建的可迭代骨架。</text>
    </view>

    <view class="nav-list">
      <button class="nav-button" @tap="navigateTo(routes.ownerDashboard)">老板工作台</button>
      <button class="nav-button" @tap="navigateTo(routes.staffImageTasks)">店员补图</button>
      <button class="nav-button" @tap="navigateTo(routes.customerProductList)">客户商城</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { navigateTo } from '../../app/navigation'
import { routes } from '../../app/routes'
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 56rpx 32rpx;
  background: #f6f7f9;
  color: #16181d;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-bottom: 40rpx;
}

.eyebrow {
  font-size: 24rpx;
  color: #576071;
}

.title {
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.2;
}

.subtitle {
  font-size: 28rpx;
  line-height: 1.6;
  color: #576071;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.nav-button {
  width: 100%;
  border-radius: 8rpx;
  color: #ffffff;
  background: #0f62fe;
}
</style>
