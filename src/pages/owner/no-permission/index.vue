<template>
  <view class="page">
    <view class="panel">
      <text class="kicker">ACCESS LIMITED</text>
      <text class="title">无权限访问该模块</text>
      <text class="desc">当前账号未获得此管理范围。请返回更多页，或联系拥有权限管理范围的账号调整授权。</text>
      <view class="actions">
        <button class="primary" :disabled="Boolean(navigatingRoute)" @tap="goMore">返回更多</button>
        <button class="secondary" :disabled="Boolean(navigatingRoute)" @tap="goDashboard">回到工作台</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { redirectTo } from '../../../app/navigation'
import { routes, type AppRoute } from '../../../app/routes'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'

const navigatingRoute = ref<AppRoute | ''>('')

onShow(() => {
  if (!ensureAdminWorkbenchSession()) {
    return
  }

  navigatingRoute.value = ''
})

const goRoute = (route: AppRoute) => {
  if (navigatingRoute.value) {
    return
  }

  navigatingRoute.value = route
  redirectTo(route, {
    onComplete: () => {
      navigatingRoute.value = ''
    },
  })
}

const goMore = () => goRoute(routes.ownerMore)
const goDashboard = () => goRoute(routes.ownerDashboard)
</script>

<style scoped>
.page {
  display: flex;
  align-items: center;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 44rpx 32rpx calc(44rpx + env(safe-area-inset-bottom));
  background: #f8f8f8;
  color: #202020;
}

.panel {
  width: 100%;
  box-sizing: border-box;
  padding: 40rpx 34rpx;
  border-radius: 34rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.06);
}

.kicker,
.title,
.desc {
  display: block;
}

.kicker {
  margin-bottom: 18rpx;
  color: #8e8e8e;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1.2;
}

.title {
  margin-bottom: 18rpx;
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.18;
}

.desc {
  color: #747474;
  font-size: 26rpx;
  line-height: 1.55;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 34rpx;
}

.primary,
.secondary {
  width: 100%;
  min-height: 92rpx;
  box-sizing: border-box;
  margin: 0;
  border-radius: 28rpx;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 92rpx;
}

.primary::after,
.secondary::after {
  border: 0;
}

.primary {
  background: #202020;
  color: #ffffff;
}

.secondary {
  background: #f0f0f0;
  color: #202020;
}
</style>
