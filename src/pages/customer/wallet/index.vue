<template>
  <view class="page">
    <view class="shell">
      <text class="title">钱包</text>
      <text class="copy">钱包功能暂未开通。当前不显示余额，不支持充值、提现或交易记录。</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 64rpx 32rpx;
  background: #f8f8f8;
  color: #222222;
}

.shell {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 42rpx 34rpx;
  border-radius: 30rpx;
  background: #ffffff;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.06);
}

.title {
  color: #111111;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.25;
}

.copy {
  color: #666666;
  font-size: 28rpx;
  line-height: 1.55;
}
</style>
