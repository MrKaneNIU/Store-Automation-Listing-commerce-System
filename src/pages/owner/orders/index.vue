<template>
  <view class="page">
    <text class="title">订单确认</text>

    <view v-for="order in viewModel.orders" :key="order.id" class="card">
      <view class="header">
        <text class="name">{{ order.customerName }} {{ order.customerPhone }}</text>
        <text class="status">{{ order.statusLabel }}</text>
      </view>

      <view v-for="item in order.items" :key="item.skuId" class="item">
        <text>{{ item.productName }}</text>
        <text>{{ item.spec }} x {{ item.quantity }}</text>
        <text>¥{{ item.salePrice }}</text>
      </view>

      <text>合计：¥{{ order.totalAmount }}</text>
      <view v-if="order.canConfirm || order.canCancel" class="actions">
        <button v-if="order.canConfirm" class="primary" size="mini" @tap="confirm(order.id)">确认订单</button>
        <button v-if="order.canCancel" size="mini" @tap="cancel(order.id)">取消订单</button>
      </view>
    </view>

    <text v-if="viewModel.orders.length === 0" class="empty">{{ viewModel.emptyMessage }}</text>
    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { cancelOwnerOrder, confirmOwnerOrder, getOwnerOrdersView } from '../../../features/owner-orders/owner-orders'

const version = ref(0)
const message = ref('')

onShow(() => {
  version.value += 1
})

const viewModel = computed(() => {
  version.value
  return getOwnerOrdersView()
})

const refreshView = () => {
  version.value += 1
}

const confirm = (orderId: string) => {
  const result = confirmOwnerOrder(orderId)
  message.value = result.message
  refreshView()
}

const cancel = (orderId: string) => {
  const result = cancelOwnerOrder(orderId)
  message.value = result.message
  refreshView()
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
  margin-bottom: 28rpx;
  font-size: 40rpx;
  font-weight: 700;
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

.header,
.actions {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.name {
  font-weight: 600;
}

.status {
  color: #0f62fe;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #eef0f3;
}

.primary {
  color: #ffffff;
  background: #0f62fe;
}

.empty {
  color: #576071;
}
</style>
