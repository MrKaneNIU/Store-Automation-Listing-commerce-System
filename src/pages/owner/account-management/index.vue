<template>
  <view class="page">
    <view class="topbar">
      <view class="brand">
        <text class="kicker">ACCOUNT</text>
        <text class="title">账号管理</text>
      </view>
      <button class="back-link" :disabled="Boolean(navigatingRoute)" @tap="goMore">更多</button>
    </view>

    <view class="mode-switch">
      <button
        class="mode-button"
        :class="{ active: activeMode === 'register' }"
        @tap="setMode('register')"
      >
        账号注册
      </button>
      <button
        class="mode-button"
        :class="{ active: activeMode === 'password' }"
        @tap="setMode('password')"
      >
        修改密码
      </button>
    </view>

    <view v-if="activeMode === 'register'" class="form-panel">
      <view class="panel-head">
        <view class="section-copy">
          <text class="section-title">账号注册</text>
          <text class="section-desc">新增工作台账号，并分配进入范围。</text>
        </view>
        <text class="section-meta">{{ permissionView.canGrantOwner ? '老板 / 员工' : '仅员工' }}</text>
      </view>

      <label class="field">
        <text class="field-label">账号ID</text>
        <input v-model="registerAccountId" class="input" placeholder="输入新账号ID" />
      </label>

      <view class="role-row">
        <button
          class="choice-pill"
          :class="{ active: registerRole === 'owner' }"
          :disabled="!permissionView.canGrantOwner"
          @tap="registerRole = 'owner'"
        >
          老板
        </button>
        <button
          class="choice-pill"
          :class="{ active: registerRole === 'staff' }"
          @tap="registerRole = 'staff'"
        >
          员工
        </button>
      </view>

      <text class="field-group-title">权限范围</text>
      <view class="scope-grid">
        <button
          v-for="scope in permissionView.scopeOptions"
          :key="scope.value"
          class="scope-pill"
          :class="{ active: registerScopes.includes(scope.value) }"
          @tap="toggleRegisterScope(scope.value)"
        >
          <text class="pill-label">{{ scope.label }}</text>
        </button>
      </view>

      <text class="form-note">注册后的初始密码为 123456，请让账号首次登录后立即修改密码。</text>
      <button class="primary" :disabled="isSubmitting" @tap="submitAccountRegistration">注册账号</button>
    </view>

    <view v-else class="form-panel">
      <view class="panel-head">
        <view class="section-copy">
          <text class="section-title">修改密码</text>
          <text class="section-desc">先输入账号ID，再校验旧密码。</text>
        </view>
        <text class="section-meta">保存后重登</text>
      </view>

      <label class="field">
        <text class="field-label">账号ID</text>
        <input v-model="passwordAccountId" class="input" placeholder="先输入账号ID" />
      </label>

      <label class="field">
        <text class="field-label">旧密码</text>
        <input v-model="oldPassword" class="input" password placeholder="输入旧密码" />
      </label>

      <label class="field">
        <text class="field-label">新密码</text>
        <input v-model="newPassword" class="input" password placeholder="至少 6 位" />
      </label>

      <label class="field">
        <text class="field-label">确认新密码</text>
        <input v-model="confirmPassword" class="input" password placeholder="再次输入新密码" />
      </label>

      <button class="primary" :disabled="isSubmitting" @tap="submitPasswordChange">保存并重新登录</button>
    </view>

    <view v-if="message" class="result" :class="{ success: resultStatus === 'success' }">
      {{ message }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { redirectTo, relaunchTo } from '../../../app/navigation'
import { routes, type AppRoute } from '../../../app/routes'
import {
  changeAdminWorkbenchPassword,
} from '../../../features/admin-workbench-auth/admin-workbench-auth'
import { ensureAdminWorkbenchSession } from '../../../features/admin-workbench-auth/admin-workbench-guard'
import {
  authorizeAdminAccount,
  getAdminPermissionView,
  type AdminPermissionScope,
} from '../../../features/admin-permissions/admin-permissions'
import { getAdminWorkbenchSession } from '../../../services/auth/admin-workbench-session'

const navigatingRoute = ref<AppRoute | ''>('')
const currentAccount = ref('')
const activeMode = ref<'register' | 'password'>('register')
const registerAccountId = ref('')
const registerRole = ref<'owner' | 'staff'>('staff')
const registerScopes = ref<AdminPermissionScope[]>(['workbenchAccess'])
const passwordAccountId = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const message = ref('')
const resultStatus = ref<'success' | 'failed' | ''>('')
const isSubmitting = ref(false)
const permissionView = ref(getAdminPermissionView('admin'))

const clearPasswordFields = () => {
  passwordAccountId.value = ''
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

const refreshPermissionView = () => {
  const session = getAdminWorkbenchSession()
  currentAccount.value = session?.account ?? ''
  permissionView.value = getAdminPermissionView(currentAccount.value)

  if (!permissionView.value.canGrantOwner && registerRole.value === 'owner') {
    registerRole.value = 'staff'
  }
}

const setMode = (mode: 'register' | 'password') => {
  activeMode.value = mode
  message.value = ''
  resultStatus.value = ''

  if (mode === 'password') {
    clearPasswordFields()
  }
}

onShow(() => {
  if (!ensureAdminWorkbenchSession('accountManagement')) {
    return
  }

  refreshPermissionView()
  clearPasswordFields()
  navigatingRoute.value = ''
  message.value = ''
  resultStatus.value = ''
  isSubmitting.value = false
})

const toggleRegisterScope = (scope: AdminPermissionScope) => {
  registerScopes.value = registerScopes.value.includes(scope)
    ? registerScopes.value.filter((item) => item !== scope)
    : [...registerScopes.value, scope]
}

const submitAccountRegistration = () => {
  if (isSubmitting.value || !currentAccount.value) {
    return
  }

  isSubmitting.value = true
  const result = authorizeAdminAccount({
    operatorAccount: currentAccount.value,
    targetAccount: registerAccountId.value.trim(),
    role: registerRole.value,
    permissions: registerScopes.value,
  })

  message.value = result.message
  resultStatus.value = result.status
  isSubmitting.value = false
  uni.showToast({
    title: result.message,
    icon: 'none',
    duration: 1600,
  })

  if (result.status === 'success') {
    registerAccountId.value = ''
    refreshPermissionView()
  }
}

const submitPasswordChange = () => {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  const result = changeAdminWorkbenchPassword({
    account: passwordAccountId.value.trim(),
    oldPassword: oldPassword.value,
    newPassword: newPassword.value,
    confirmPassword: confirmPassword.value,
  })

  message.value = result.message
  resultStatus.value = result.status
  isSubmitting.value = false
  uni.showToast({
    title: result.message,
    icon: 'none',
    duration: 1600,
  })

  if (result.status === 'success') {
    clearPasswordFields()
    relaunchTo(routes.adminLogin)
  }
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
  padding: 32rpx 32rpx calc(64rpx + env(safe-area-inset-bottom));
  background: #f8f8f8;
  color: #202020;
}

.topbar,
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.topbar {
  margin-bottom: 34rpx;
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
.mode-button,
.choice-pill,
.scope-pill,
.primary {
  margin: 0;
  border: 0;
}

.back-link::after,
.mode-button::after,
.choice-pill::after,
.scope-pill::after,
.primary::after {
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

.mode-switch,
.form-panel,
.result {
  box-sizing: border-box;
  border-radius: 30rpx;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding: 12rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 44rpx rgba(22, 22, 22, 0.05);
}

.mode-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  border-radius: 22rpx;
  background: #f2f2f2;
  color: #666666;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.2;
  transition: opacity 160ms ease, transform 160ms ease;
}

.mode-button.active,
.choice-pill.active,
.scope-pill.active,
.primary {
  background: #202020;
  color: #ffffff;
}

.form-panel,
.result {
  margin-bottom: 22rpx;
  padding: 32rpx 28rpx 30rpx;
  background: #ffffff;
  box-shadow: 0 24rpx 58rpx rgba(22, 22, 22, 0.06);
}

.panel-head {
  align-items: flex-start;
}

.section-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  line-height: 1.35;
}

.section-desc {
  color: #7a7a7a;
  font-size: 23rpx;
  line-height: 1.45;
}

.section-meta {
  flex: 0 0 auto;
  max-width: 190rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #f3f3f3;
  color: #777777;
  font-size: 22rpx;
  line-height: 1.25;
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
  box-sizing: border-box;
  width: 100%;
  min-height: 96rpx;
  padding: 0 26rpx;
  border-radius: 22rpx;
  background: #f6f6f6;
  color: #202020;
  font-size: 28rpx;
  line-height: 96rpx;
}

.role-row,
.scope-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx 12rpx;
  margin-top: 16rpx;
}

.field-group-title {
  display: block;
  margin-top: 28rpx;
  color: #4a4a4a;
  font-size: 24rpx;
  font-weight: 600;
  line-height: 1.3;
}

.choice-pill,
.scope-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 72rpx;
  padding: 0 26rpx;
  border-radius: 22rpx;
  background: #f0f0f0;
  color: #505050;
  font-size: 24rpx;
  line-height: 72rpx;
  transition: opacity 160ms ease, transform 160ms ease;
}

.choice-pill {
  min-width: 96rpx;
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

.choice-pill[disabled],
.scope-pill[disabled],
.primary[disabled] {
  background: #f0f0f0;
  color: #b4b4b4;
}

.form-note {
  display: block;
  margin-top: 26rpx;
  padding: 20rpx 22rpx;
  border-radius: 20rpx;
  background: #f7f4ef;
  color: #77634a;
  font-size: 24rpx;
  line-height: 1.5;
}

.primary {
  width: 100%;
  min-height: 92rpx;
  margin-top: 30rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
  font-weight: 600;
  transition: opacity 160ms ease, transform 160ms ease;
}

.mode-button:active,
.choice-pill:active,
.scope-pill:active,
.primary:active {
  transform: scale(0.98);
}

.result {
  padding: 22rpx 24rpx;
  border: 1rpx solid #efe4d5;
  background: #fffaf2;
  color: #6b4b1f;
  font-size: 26rpx;
  line-height: 1.45;
}

.result.success {
  color: #1f5f3d;
}
</style>
