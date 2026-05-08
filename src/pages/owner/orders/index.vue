<template>
  <view class="page">
    <text class="title">订单确认</text>

    <view v-for="order in orders" :key="order.id" class="card">
      <view class="header">
        <text class="name">{{ order.customerName }} {{ order.customerPhone }}</text>
        <text class="status">{{ statusText[order.status] }}</text>
      </view>

      <view v-for="item in order.items" :key="item.skuId" class="item">
        <text>{{ item.productName }}</text>
        <text>{{ item.spec }} x {{ item.quantity }}</text>
        <text>￥{{ item.salePrice }}</text>
      </view>

      <text>合计：￥{{ order.totalAmount }}</text>
      <view v-if="order.status === 'pending_merchant_confirm'" class="actions">
        <button class="primary" size="mini" @tap="confirm(order.id)">确认订单</button>
        <button size="mini" @tap="cancel(order.id)">取消订单</button>
      </view>
    </view>

    <text v-if="orders.length === 0" class="empty">暂无订单</text>
    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import type { OrderStatus } from '../../../domain/order/types'
import { mallWorkflow } from '../../../features/mall-workflow/mall-workflow'
import { mallRepository } from '../../../services/repositories/mall-repository'

const statusText: Record<OrderStatus, string> = {
  pending_merchant_confirm: '待商家确认',
  confirmed: '已确认',
  canceled: '已取消',
}

const version = ref(0)
const message = ref('')

onShow(() => {
  version.value += 1
})

const orders = computed(() => {
  version.value
  return mallRepository.listOrders()
})

const confirm = (orderId: string) => {
  const order = mallWorkflow.confirmOrder(orderId)
  message.value = `订单已确认：${order.id}`
  version.value += 1
}

const cancel = (orderId: string) => {
  const order = mallWorkflow.cancelOrder(orderId)
  message.value = `订单已取消：${order.id}`
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
