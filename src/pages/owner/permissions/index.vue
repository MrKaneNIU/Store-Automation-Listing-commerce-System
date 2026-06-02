<template>
  <view class="page">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">PERMISSIONS</text>
        <text class="title">权限管理</text>
      </view>
      <button class="back-link" :disabled="Boolean(navigatingRoute)" @tap="goMore">更多</button>
    </view>

    <view class="grant-panel">
      <view class="panel-head">
        <text class="section-title">新增或授权账号</text>
        <text class="section-meta">{{ viewModel.canGrantOwner ? '可授权老板' : '仅员工' }}</text>
      </view>

      <label class="field">
        <text class="field-label">账号</text>
        <input v-model="targetAccount" class="input" placeholder="输入账号" />
      </label>

      <view class="role-row">
        <button class="role-pill" :class="{ active: selectedRole === 'owner' }" :disabled="!viewModel.canGrantOwner" @tap="selectedRole = 'owner'">老板</button>
        <button class="role-pill" :class="{ active: selectedRole === 'staff' }" @tap="selectedRole = 'staff'">员工</button>
      </view>

      <view class="scope-grid">
        <button
          v-for="scope in viewModel.scopeOptions"
          :key="scope.value"
          class="scope-pill"
          :class="{ active: selectedScopes.includes(scope.value) }"
          @tap="toggleScope(scope.value)"
        >
          <text class="pill-label">{{ scope.label }}</text>
        </button>
      </view>

      <button class="primary" :disabled="!targetAccount" @tap="authorizeAccount">保存授权</button>
    </view>

    <view class="account-list">
      <view v-for="account in viewModel.accounts" :key="account.account" class="account-card">
        <view class="account-main">
          <text class="account-name">{{ account.account }}</text>
          <view class="account-status-row">
            <text class="account-meta">{{ account.roleLabel }}</text>
            <text class="account-dot">·</text>
            <text class="account-meta">{{ account.statusLabel }}</text>
          </view>
          <text class="account-scope">{{ account.permissionLabels.join(' / ') }}</text>
        </view>
        <button
          class="secondary"
          :disabled="account.role === 'creator'"
          @tap="disableAccount(account.account)"
        >
          禁用
        </button>
      </view>
    </view>

    <view class="log-panel">
      <text class="section-title">授权记录</text>
      <view v-if="viewModel.auditLogs.length === 0" class="empty-log">暂无记录</view>
      <view v-for="log in viewModel.auditLogs" :key="log.id" class="log-row">
        <text>{{ log.actionLabel }}</text>
        <text>{{ log.operatorAccount }} → {{ log.targetAccount }}</text>
      </view>
    </view>

    <view v-if="message" class="result">{{ message }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { navigateTo, redirectTo } from '../../../app/navigation'
import { routes, type AppRoute } from '../../../app/routes'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import { getAdminWorkbenchSession } from '../../../services/auth/admin-workbench-session'
import {
  authorizeAdminAccount,
  disableAdminAccount,
  getAdminPermissionView,
  type AdminPermissionScope,
} from '../../../features/admin-permissions/admin-permissions'

const targetAccount = ref('')
const selectedRole = ref<'owner' | 'staff'>('owner')
const selectedScopes = ref<AdminPermissionScope[]>(['workbenchAccess'])
const message = ref('')
const navigatingRoute = ref<AppRoute | ''>('')
const viewModel = ref(getAdminPermissionView('admin'))

const refreshView = () => {
  const session = getAdminWorkbenchSession()
  viewModel.value = getAdminPermissionView(session?.account ?? '')

  if (!viewModel.value.canGrantOwner && selectedRole.value === 'owner') {
    selectedRole.value = 'staff'
  }
}

onShow(() => {
  if (!ensureAdminWorkbenchSession('permissionManagement')) {
    return
  }

  navigatingRoute.value = ''
  refreshView()
})

const toggleScope = (scope: AdminPermissionScope) => {
  selectedScopes.value = selectedScopes.value.includes(scope)
    ? selectedScopes.value.filter((item) => item !== scope)
    : [...selectedScopes.value, scope]
}

const authorizeAccount = () => {
  const session = getAdminWorkbenchSession()
  if (!session) {
    return
  }
  const nextTargetAccount = targetAccount.value.trim()
  const existingAccount = viewModel.value.accounts.find((account) => account.account === nextTargetAccount)

  if (!existingAccount) {
    message.value = '请先在账号管理中注册账号并设置初始密码'
    navigatingRoute.value = routes.ownerAccountManagement
    navigateTo(routes.ownerAccountManagement, {
      onComplete: () => {
        navigatingRoute.value = ''
      },
    })
    return
  }

  const result = authorizeAdminAccount({
    operatorAccount: session.account,
    targetAccount: nextTargetAccount,
    role: selectedRole.value,
    permissions: selectedScopes.value,
  })
  message.value = result.message
  if (result.status === 'success') {
    targetAccount.value = ''
  }
  refreshView()
}

const disableAccount = (account: string) => {
  const session = getAdminWorkbenchSession()
  if (!session) {
    return
  }

  const result = disableAdminAccount({
    operatorAccount: session.account,
    targetAccount: account,
  })
  message.value = result.message
  refreshView()
}

const goMore = () => {
  if (navigatingRoute.value) {
    return
  }

  navigatingRoute.value = routes.ownerMore
  redirectTo(routes.ownerMore, {
    onComplete: () => {
      navigatingRoute.value = ''
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 32rpx 28rpx calc(64rpx + env(safe-area-inset-bottom));
  background: #f8f8f8;
  color: #202020;
}

.topbar,
.panel-head,
.account-card,
.log-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.topbar {
  margin-bottom: 28rpx;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.kicker {
  color: #8e8e8e;
  font-size: 22rpx;
  font-weight: 500;
}

.title {
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.15;
}

.back-link,
.role-pill,
.scope-pill,
.primary,
.secondary {
  margin: 0;
  border: 0;
}

.back-link::after,
.role-pill::after,
.scope-pill::after,
.primary::after,
.secondary::after {
  border: 0;
}

.back-link {
  min-height: 60rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: #202020;
  font-size: 24rpx;
  line-height: 60rpx;
}

.back-link[disabled] {
  opacity: 0.56;
}

.grant-panel,
.account-card,
.log-panel,
.result {
  box-sizing: border-box;
  border-radius: 28rpx;
}

.grant-panel,
.account-card,
.log-panel,
.result {
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(12, 12, 12, 0.05);
}

.grant-panel,
.log-panel {
  margin-bottom: 20rpx;
  padding: 28rpx 26rpx;
}

.panel-head {
  align-items: flex-start;
}

.section-title {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.35;
}

.section-meta,
.account-meta,
.account-scope,
.empty-log {
  display: block;
  color: #8a8a8a;
  font-size: 24rpx;
  line-height: 1.45;
}

.section-meta {
  flex: 0 0 auto;
  max-width: 220rpx;
  text-align: right;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 24rpx;
}

.field-label {
  font-size: 24rpx;
  font-weight: 600;
}

.input {
  min-height: 88rpx;
  box-sizing: border-box;
  padding: 0 24rpx;
  border-radius: 24rpx;
  background: #f5f5f5;
  font-size: 28rpx;
  line-height: 88rpx;
}

.role-row,
.scope-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx 12rpx;
  margin-top: 24rpx;
}

.role-pill,
.scope-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 68rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #f0f0f0;
  color: #505050;
  font-size: 24rpx;
  line-height: 68rpx;
}

.role-pill {
  min-width: 96rpx;
}

.scope-pill {
  max-width: 100%;
}

.pill-label {
  display: block;
  max-width: 100%;
  color: inherit;
  font-size: 24rpx;
  line-height: 1.25;
  white-space: normal;
  word-break: keep-all;
}

.role-pill.active,
.scope-pill.active,
.primary {
  background: #202020;
  color: #ffffff;
}

.role-pill[disabled],
.scope-pill[disabled],
.primary[disabled],
.secondary[disabled] {
  background: #f0f0f0;
  color: #b4b4b4;
}

.primary {
  width: 100%;
  min-height: 92rpx;
  margin-top: 24rpx;
  border-radius: 28rpx;
  font-size: 28rpx;
  font-weight: 600;
}

.account-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.account-card {
  align-items: flex-start;
  padding: 26rpx;
}

.account-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
  padding-right: 18rpx;
}

.account-name {
  display: block;
  width: 100%;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.25;
  word-break: break-all;
}

.account-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8rpx;
  width: 100%;
}

.account-dot {
  color: #c0c0c0;
  font-size: 24rpx;
  line-height: 1.45;
}

.account-meta,
.account-scope {
  display: block;
}

.account-scope {
  width: 100%;
  word-break: break-all;
}

.secondary {
  flex: 0 0 auto;
  min-height: 68rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #f0f0f0;
  color: #202020;
  font-size: 24rpx;
  line-height: 68rpx;
}

.log-row {
  padding-top: 18rpx;
  color: #505050;
  font-size: 24rpx;
}

.result {
  padding: 24rpx 28rpx;
  font-size: 26rpx;
}
</style>
