<template>
  <view class="page">
    <button class="back-button" aria-label="返回" @tap="goBack">
      <text class="back-icon">‹</text>
    </button>

    <view class="shell">
      <view class="header">
        <text class="eyebrow">ADMIN WORKBENCH</text>
        <text class="title">Login</text>
        <text class="subtitle">管理工作台账号密码入口</text>
      </view>

      <view class="form">
        <view class="field-card">
          <view class="field-head">
            <text class="label">ACCOUNT</text>
            <text v-if="isAccountReady" class="account-check">✓</text>
          </view>
          <input v-model="account" class="input" type="text" maxlength="32" placeholder="请输入账号" />
        </view>
        <view class="field-card">
          <view class="field-head">
            <text class="label">PASSWORD</text>
          </view>
          <input
            v-model="password"
            class="input"
            password
            maxlength="64"
            placeholder="请输入密码"
          />
        </view>

        <text v-if="errorMessage" class="error">{{ errorMessage }}</text>

        <button class="submit" :class="{ busy: submitting }" :disabled="submitting" @tap="handleSubmit">
          <text class="submit-label">LOGIN</text>
        </button>

        <button class="forgot" disabled>
          Forgot your password?
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { relaunchTo } from '../../app/navigation'
import { routes } from '../../app/routes'
import { submitAdminWorkbenchAuth } from '../../features/admin-workbench-auth/admin-workbench-auth'

const account = ref('')
const password = ref('')
const errorMessage = ref('')
const submitting = ref(false)

const isAccountReady = computed(() => account.value.trim().length > 0)

const goBack = () => {
  relaunchTo(routes.customerHome)
}

const handleSubmit = () => {
  if (submitting.value) {
    return
  }

  submitting.value = true
  errorMessage.value = ''

  const result = submitAdminWorkbenchAuth({
    account: account.value.trim(),
    password: password.value,
  })

  submitting.value = false

  if (result.status === 'failed') {
    errorMessage.value = result.message
    return
  }

  relaunchTo(routes.ownerDashboard)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  padding: calc(env(safe-area-inset-top) + 28rpx) 34rpx calc(42rpx + env(safe-area-inset-bottom));
  background: #fbfaf8;
  color: #151515;
}

.back-button {
  position: absolute;
  top: calc(env(safe-area-inset-top) + 26rpx);
  left: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  min-height: 72rpx;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.86);
  color: #171717;
  box-shadow: 0 16rpx 42rpx rgba(20, 20, 20, 0.08);
  transition: opacity 140ms ease, transform 140ms ease;
}

.back-button::after {
  border: 0;
}

.back-button:active {
  opacity: 0.82;
  transform: scale(0.97);
}

.back-icon {
  display: block;
  margin-top: -4rpx;
  font-size: 54rpx;
  font-weight: 400;
  line-height: 1;
}

.shell {
  width: 100%;
  max-width: 640rpx;
  margin: auto 0;
  padding: 126rpx 4rpx 24rpx;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-bottom: 52rpx;
}

.eyebrow {
  color: #8f8a83;
  font-size: 20rpx;
  font-weight: 600;
  letter-spacing: 0;
}

.title {
  color: #151515;
  font-size: 72rpx;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.subtitle {
  color: #817b73;
  font-size: 24rpx;
  line-height: 1.5;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 26rpx;
}

.field-card {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  box-sizing: border-box;
  min-height: 138rpx;
  padding: 24rpx 26rpx 20rpx;
  border-radius: 32rpx;
  background: #ffffff;
  box-shadow: 0 18rpx 54rpx rgba(26, 24, 21, 0.08);
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28rpx;
}

.label {
  color: #817b73;
  font-size: 20rpx;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0;
}

.account-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background: #191919;
  color: #ffffff;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1;
}

.input {
  width: 100%;
  min-height: 54rpx;
  box-sizing: border-box;
  padding: 0;
  border: 0;
  background: transparent;
  color: #151515;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 1.2;
}

.input::placeholder {
  color: #b8ab9b;
}

.error {
  color: #b5473f;
  font-size: 24rpx;
  line-height: 1.4;
}

.submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 98rpx;
  min-height: 98rpx;
  margin: 18rpx 0 0;
  padding: 0;
  box-sizing: border-box;
  border-radius: 30rpx;
  background: #151515;
  color: #ffffff;
  border: 0;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  transition: opacity 140ms ease, transform 140ms ease;
}

.submit::after {
  border: 0;
}

.submit-label {
  display: block;
  width: 100%;
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  letter-spacing: 0;
}

.forgot {
  min-height: 54rpx;
  margin: 4rpx auto 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: #888178;
  font-size: 24rpx;
  font-weight: 500;
  line-height: 54rpx;
}

.forgot::after {
  border: 0;
}

.busy {
  opacity: 0.72;
  transform: scale(0.98);
}
</style>
