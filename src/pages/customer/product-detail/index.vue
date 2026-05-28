<template>
  <view class="page">
    <view v-if="isDetailLoading" class="detail-loading">
      <view class="detail-topbar">
        <button
          class="icon-button plain"
          :class="{ busy: isBackNavigating }"
          :disabled="isBackNavigating"
          aria-label="返回商品列表"
          hover-class="press-feedback"
          @tap="goBack"
        >
          <text class="chevron">‹</text>
        </button>
        <text class="nav-title">商品详情</text>
        <view class="icon-button ghost" />
      </view>

      <view class="loading-gallery shimmer" />
      <view class="loading-body">
        <text class="loading-line short shimmer" />
        <text class="loading-line title-line shimmer" />
        <text class="loading-line price-line shimmer" />
        <text class="loading-line copy-line shimmer" />
        <text class="loading-line copy-line narrow shimmer" />
      </view>
    </view>

    <view v-else-if="viewModel.product && viewModel.isPublished" class="detail-screen">
      <view class="detail-topbar">
        <button
          class="icon-button plain"
          :class="{ busy: isBackNavigating }"
          :disabled="isBackNavigating"
          aria-label="返回商品列表"
          hover-class="press-feedback"
          @tap="goBack"
        >
          <text class="chevron">‹</text>
        </button>
        <text class="nav-title">商品详情</text>
        <button class="icon-button plain" aria-label="更多操作" hover-class="press-feedback" @tap="showVisualOnlyToast('分享与更多操作仅做视觉入口')">
          <text class="more-mark">•••</text>
        </button>
      </view>

      <scroll-view class="detail-gallery" scroll-x enable-flex>
        <view class="gallery-inner">
          <view class="gallery-card">
            <image v-if="viewModel.product.mainImageUrl" class="image" :src="viewModel.product.mainImageUrl" mode="aspectFill" />
            <view v-else class="fashion-visual" :class="primaryVisualClass" />
          </view>
          <view class="gallery-card">
            <view class="fashion-visual runway" />
          </view>
        </view>
      </scroll-view>

      <view class="detail-body">
        <view class="detail-meta">
          <text class="product-code">SKU {{ viewModel.product.productCode }}</text>
          <button class="favorite-button" @tap="showVisualOnlyToast('收藏为视觉入口，真实收藏能力需单独 PRD')">
            <text>♡</text>
          </button>
        </view>

        <text class="title">{{ viewModel.product.productName }}</text>
        <text class="detail-price">{{ selectedPrice }}</text>
        <text class="detail-copy">{{ viewModel.descriptionText }}</text>

        <view class="selector-row">
          <view class="select-box">
            <text>已选规格</text>
            <button @tap="showVisualOnlyToast(selectedSkuLabel)">
              {{ selectedSkuLabel }}
            </button>
          </view>
          <view class="select-box">
            <text>库存状态</text>
            <button @tap="showVisualOnlyToast(selectedStockLabel)">
              {{ selectedStockLabel }}
            </button>
          </view>
        </view>

        <view class="spec-pills">
          <button
            v-for="sku in viewModel.skus"
            :key="sku.id"
            class="spec-pill"
            :class="{ active: sku.isSelected, disabled: sku.isDisabled }"
            @tap="selectSku(sku.id)"
          >
            <text>{{ sku.spec }}</text>
            <text>{{ sku.isDisabled ? '售罄' : `¥${sku.salePrice}` }}</text>
          </button>
        </view>

        <view class="detail-info">
          <view class="info-card">
            <text>配送说明</text>
            <text>同城次日达，偏远地区按实际物流时效。</text>
          </view>
          <view class="info-card">
            <text>下单授权</text>
            <text>只有确认下单时才触发微信登录和手机号授权。</text>
          </view>
        </view>

        <view v-if="message" class="auth-feedback">
          <text>{{ message }}</text>
          <text>若你取消授权，系统不会创建订单。</text>
        </view>
      </view>

      <view class="detail-cta">
        <button
          class="secondary-bag-button"
          :class="{ disabledButton: isAddingToBag || !viewModel.canSubmitOrder }"
          :disabled="isAddingToBag || !viewModel.canSubmitOrder"
          hover-class="press-feedback"
          @tap="addToShoppingBag"
        >
          <text>{{ isAddingToBag ? '加入中' : '加入购物袋' }}</text>
        </button>
        <button class="primary-button" :class="{ disabledButton: !viewModel.canSubmitOrder }" @tap="submitOrder">
          <text>微信手机号下单</text>
          <text class="button-mark">↗</text>
        </button>
      </view>

      <view v-if="authPrompt" class="modal-layer">
        <view class="modal-sheet">
          <button class="modal-close" aria-label="关闭授权弹窗" @tap="resolveAuthPrompt(false)">
            <text>×</text>
          </button>
          <text class="modal-kicker">ORDER ACCESS</text>
          <text class="modal-title">下单前需要授权</text>
          <text class="modal-copy">{{ authPrompt.content }}</text>
          <view class="modal-actions">
            <button class="secondary-action" @tap="resolveAuthPrompt(false)">暂不授权</button>
            <button class="primary-button compact" @tap="resolveAuthPrompt(true)">
              <text>授权</text>
            </button>
          </view>
        </view>
      </view>

      <view v-if="phoneCodeRequest" class="modal-layer">
        <view class="modal-sheet">
          <button class="modal-close" aria-label="关闭手机号授权弹窗" @tap="resolvePhoneCode(null)">
            <text>×</text>
          </button>
          <text class="modal-kicker">PHONE ACCESS</text>
          <text class="modal-title">授权手机号</text>
          <text class="modal-copy">微信会返回一次性手机号授权 code，后端会用它换取真实手机号并创建订单。</text>
          <view class="modal-actions">
            <button class="secondary-action" @tap="resolvePhoneCode(null)">暂不授权</button>
            <button
              class="primary-button compact"
              open-type="getPhoneNumber"
              @getphonenumber="handlePhoneNumberAuthorization"
            >
              <text>微信授权</text>
            </button>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <button
        class="icon-button plain"
        :class="{ busy: isBackNavigating }"
        :disabled="isBackNavigating"
        aria-label="返回商品列表"
        hover-class="press-feedback"
        @tap="goBack"
      >
        <text class="chevron">‹</text>
      </button>
      <text class="empty-title">{{ viewModel.emptyMessage }}</text>
      <text class="empty-copy">商品可能已下架，请返回商城查看其他已上架单品。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { redirectTo } from '../../../app/navigation'
import { routes } from '../../../app/routes'
import {
  type CustomerProductDetailViewModel,
} from '../../../features/customer-product-detail/customer-product-detail'
import {
  getCloudBaseCustomerProductDetailView,
  selectCloudBaseCustomerProductSkuInView,
  submitCloudBaseCustomerProductDetailOrder,
} from '../../../features/cloudbase-mall/customer-product-detail'
import { addCloudBaseCustomerShoppingBagItem } from '../../../features/cloudbase-mall/customer-shopping-bag'
import { createCloudBaseWechatAuthService } from '../../../services/auth/cloudbase-wechat-auth-service'

type AuthPrompt = {
  content: string
  resolve: (value: boolean) => void
}

type PhoneCodeRequest = {
  resolve: (value: string | null) => void
}

type PhoneNumberAuthorizationEvent = {
  detail?: {
    code?: string
    errMsg?: string
  }
}

const productId = ref('')
const selectedSkuId = ref('')
const message = ref('')
const authPrompt = ref<AuthPrompt | null>(null)
const phoneCodeRequest = ref<PhoneCodeRequest | null>(null)
const isDetailLoading = ref(true)
const isBackNavigating = ref(false)
const isAddingToBag = ref(false)
const customerAuthService = createCloudBaseWechatAuthService()
const viewModel = ref<CustomerProductDetailViewModel>({
  product: null,
  descriptionText: '暂无商品简介，商家正在完善中。',
  skus: [],
  isPublished: false,
  canSubmitOrder: false,
  emptyMessage: '商品不存在或未上架',
})

const selectedSku = computed(() => viewModel.value.skus.find((sku) => sku.isSelected))

const selectedPrice = computed(() => {
  if (selectedSku.value) {
    return `¥${selectedSku.value.salePrice}`
  }

  const prices = viewModel.value.skus.map((sku) => sku.salePrice)
  if (prices.length === 0) {
    return '价格待定'
  }

  return `¥${Math.min(...prices)} 起`
})

const selectedSkuLabel = computed(() => selectedSku.value?.spec ?? '请选择')

const selectedStockLabel = computed(() => {
  if (!selectedSku.value) {
    return '待选择'
  }

  return selectedSku.value.isDisabled ? '暂无库存' : `库存 ${selectedSku.value.stock}`
})

const primaryVisualClass = computed(() => {
  const productCode = viewModel.value.product?.productCode ?? ''
  const seed = productCode.charCodeAt(productCode.length - 1) || 0
  return seed % 3 === 0 ? 'dress' : seed % 3 === 1 ? 'coat' : 'runway'
})

onLoad((query) => {
  productId.value = String(query?.id ?? '')
  void refreshView()
})

type RefreshOptions = {
  showLoading: boolean
}

const refreshView = async (options: RefreshOptions = { showLoading: true }) => {
  if (options.showLoading) {
    isDetailLoading.value = true
  }

  try {
    viewModel.value = await getCloudBaseCustomerProductDetailView(productId.value, selectedSkuId.value)
  } finally {
    if (options.showLoading) {
      isDetailLoading.value = false
    }
  }
}

const selectSku = (skuId: string) => {
  const result = selectCloudBaseCustomerProductSkuInView(viewModel.value, skuId)
  selectedSkuId.value = result.selectedSkuId
  message.value = result.message
  viewModel.value = result.view
}

const confirmModal = (content: string) =>
  new Promise<boolean>((resolve) => {
    authPrompt.value = {
      content,
      resolve,
    }
  })

const resolveAuthPrompt = (value: boolean) => {
  const prompt = authPrompt.value
  authPrompt.value = null
  prompt?.resolve(value)
}

const requestPhoneCode = () =>
  new Promise<string | null>((resolve) => {
    phoneCodeRequest.value = { resolve }
  })

const resolvePhoneCode = (code: string | null) => {
  const request = phoneCodeRequest.value
  phoneCodeRequest.value = null
  request?.resolve(code)
}

const handlePhoneNumberAuthorization = (event: PhoneNumberAuthorizationEvent) => {
  const code = event.detail?.code
  resolvePhoneCode(code && code.trim() ? code : null)
}

const submitOrder = async () => {
  if (!viewModel.value.canSubmitOrder) {
    message.value = '请选择有库存的规格'
    return
  }

  const result = await submitCloudBaseCustomerProductDetailOrder({
    productId: productId.value,
    skuId: selectedSkuId.value,
    quantity: 1,
    authService: customerAuthService,
    confirmLogin: () => confirmModal('浏览商品不需要登录。只有你确认下单时，真实小程序才会触发微信快捷登录。'),
    confirmPhoneAuthorization: () => confirmModal('需要授权微信绑定手机号，用于商家确认订单。'),
    requestPhoneNumber: requestPhoneCode,
  })
  message.value = result.message
  await refreshView({ showLoading: false })
}

const addToShoppingBag = async () => {
  if (isAddingToBag.value) {
    return
  }

  if (!viewModel.value.canSubmitOrder || !selectedSku.value) {
    message.value = '请选择有库存的规格'
    return
  }

  isAddingToBag.value = true

  try {
    const result = await addCloudBaseCustomerShoppingBagItem({
      productId: productId.value,
      skuId: selectedSku.value.id,
      quantity: 1,
    })

    message.value = result.message
  } finally {
    isAddingToBag.value = false
  }
}

const goBack = () => {
  if (isBackNavigating.value) {
    return
  }

  isBackNavigating.value = true
  uni.navigateBack({
    delta: 1,
    fail: () => {
      isBackNavigating.value = false
      redirectTo(routes.customerProductList)
    },
  })
}

const showVisualOnlyToast = (title: string) => {
  uni.showToast({
    title,
    icon: 'none',
    duration: 1800,
  })
}
</script>

<style scoped>
.page,
.detail-screen,
.detail-loading {
  min-height: 100vh;
  box-sizing: border-box;
  overflow-x: hidden;
  background: #ffffff;
  color: #222222;
}

.detail-screen {
  padding-bottom: calc(230rpx + env(safe-area-inset-bottom));
}

.detail-loading {
  padding-bottom: 60rpx;
}

.detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  min-height: 124rpx;
  padding: 28rpx 32rpx 0;
}

.icon-button,
.favorite-button,
.select-box button,
  .spec-pill,
  .primary-button,
  .secondary-bag-button,
  .modal-close,
  .secondary-action {
  margin: 0;
  border: 0;
  transition: opacity 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.icon-button::after,
.favorite-button::after,
.select-box button::after,
.spec-pill::after,
.primary-button::after,
.secondary-bag-button::after,
.modal-close::after,
.secondary-action::after {
  border: 0;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  min-width: 88rpx;
  height: 88rpx;
  padding: 0;
  border-radius: 999rpx;
  background: #ffffff;
  color: #050505;
  box-shadow: 0 0 0 1rpx #e8e8e8 inset;
}

.icon-button.ghost {
  pointer-events: none;
  opacity: 0;
}

.press-feedback {
  opacity: 0.76;
  transform: scale(0.97);
}

.busy {
  opacity: 0.62;
}

.chevron {
  display: block;
  font-size: 52rpx;
  font-weight: 300;
  line-height: 1;
}

.more-mark {
  display: block;
  font-size: 28rpx;
  letter-spacing: 2rpx;
  line-height: 1;
}

.nav-title {
  min-width: 0;
  flex: 1 1 auto;
  color: #222222;
  font-size: 42rpx;
  font-weight: 500;
  line-height: 1.15;
  text-align: center;
}

.detail-gallery {
  width: 100%;
  margin-top: 24rpx;
  white-space: nowrap;
}

.gallery-inner {
  display: flex;
  gap: 24rpx;
  padding: 0 32rpx;
}

.gallery-card {
  position: relative;
  flex: 0 0 650rpx;
  width: 650rpx;
  height: 940rpx;
  overflow: hidden;
  border-radius: 30rpx;
  background: #f0f0f0;
}

.loading-gallery {
  height: 940rpx;
  margin: 24rpx 32rpx 0;
  border-radius: 30rpx;
  background: #f0f0f0;
}

.loading-body {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
  padding: 40rpx 32rpx 0;
}

.loading-line {
  display: block;
  height: 28rpx;
  border-radius: 999rpx;
  background: #eeeeee;
}

.loading-line.short {
  width: 34%;
}

.loading-line.title-line {
  width: 76%;
  height: 64rpx;
}

.loading-line.price-line {
  width: 44%;
  height: 58rpx;
}

.loading-line.copy-line {
  width: 100%;
}

.loading-line.narrow {
  width: 68%;
}

.shimmer {
  position: relative;
  overflow: hidden;
}

.shimmer::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -45%;
  width: 45%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.62), transparent);
  content: "";
  transform: translateX(0);
  animation: shimmer-slide 1.2s ease-in-out infinite;
}

@keyframes shimmer-slide {
  100% {
    transform: translateX(320%);
  }
}

.image,
.fashion-visual {
  width: 100%;
  height: 100%;
}

.fashion-visual {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.86) 0 8%, transparent 8.4%),
    linear-gradient(110deg, transparent 0 36%, rgba(5, 5, 5, 0.82) 36.4% 49%, transparent 49.4%),
    radial-gradient(ellipse at 50% 72%, rgba(5, 5, 5, 0.88) 0 30%, transparent 30.5%),
    linear-gradient(145deg, #d8d8d8 0%, #f7f7f7 42%, #bdbdbd 100%);
}

.fashion-visual::before,
.fashion-visual::after {
  position: absolute;
  border-radius: 999rpx;
  background: rgba(5, 5, 5, 0.78);
  content: "";
}

.fashion-visual::before {
  top: 22%;
  left: 43%;
  width: 14%;
  height: 42%;
  transform: rotate(-6deg);
}

.fashion-visual::after {
  right: 18%;
  bottom: 8%;
  width: 46%;
  height: 18%;
  background: rgba(255, 255, 255, 0.42);
  transform: rotate(-18deg);
}

.fashion-visual.coat {
  background:
    radial-gradient(circle at 49% 16%, rgba(255, 255, 255, 0.9) 0 8%, transparent 8.4%),
    linear-gradient(105deg, transparent 0 31%, rgba(5, 5, 5, 0.86) 31.4% 56%, transparent 56.4%),
    radial-gradient(ellipse at 50% 74%, rgba(5, 5, 5, 0.9) 0 29%, transparent 29.5%),
    linear-gradient(145deg, #ececec, #f9f9f9 48%, #c6c6c6);
}

.fashion-visual.dress {
  background:
    radial-gradient(circle at 51% 17%, rgba(255, 255, 255, 0.9) 0 8%, transparent 8.4%),
    linear-gradient(100deg, transparent 0 38%, rgba(5, 5, 5, 0.78) 38.4% 47%, transparent 47.4%),
    radial-gradient(ellipse at 50% 76%, rgba(5, 5, 5, 0.82) 0 34%, transparent 34.5%),
    linear-gradient(145deg, #dddddd, #ffffff 46%, #b8b8b8);
}

.fashion-visual.runway {
  background:
    radial-gradient(circle at 48% 18%, rgba(255, 255, 255, 0.9) 0 7.4%, transparent 7.8%),
    linear-gradient(108deg, transparent 0 34%, rgba(5, 5, 5, 0.82) 34.4% 50%, transparent 50.4%),
    radial-gradient(ellipse at 48% 70%, rgba(5, 5, 5, 0.86) 0 32%, transparent 32.5%),
    linear-gradient(160deg, #cfcfcf, #fbfbfb 42%, #9d9d9d);
}

.detail-body {
  box-sizing: border-box;
  padding: 40rpx 32rpx 0;
  background: #ffffff;
}

.detail-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.product-code {
  min-width: 0;
  overflow: hidden;
  color: #9a9a9a;
  font-size: 26rpx;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-button {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  padding: 0;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #050505;
  box-shadow: 0 18rpx 44rpx rgba(0, 0, 0, 0.1);
}

.favorite-button text {
  font-size: 34rpx;
  line-height: 1;
}

.title {
  display: block;
  margin-top: 22rpx;
  color: #050505;
  font-size: 68rpx;
  font-weight: 500;
  line-height: 1.12;
  overflow-wrap: anywhere;
}

.detail-price {
  display: block;
  margin-top: 22rpx;
  color: #050505;
  font-size: 68rpx;
  font-weight: 500;
  line-height: 1;
}

.detail-copy {
  display: block;
  margin-top: 28rpx;
  color: #666666;
  font-size: 31rpx;
  line-height: 1.55;
}

.selector-row {
  display: flex;
  gap: 20rpx;
  margin-top: 38rpx;
}

.select-box {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 10rpx;
  min-width: 0;
}

.select-box > text {
  color: #9a9a9a;
  font-size: 26rpx;
  line-height: 1.2;
}

.select-box button {
  min-height: 84rpx;
  padding: 0 24rpx;
  border-radius: 22rpx;
  background: #ffffff;
  color: #050505;
  font-size: 28rpx;
  line-height: 84rpx;
  text-align: left;
  box-shadow: inset 0 0 0 1rpx #e8e8e8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 28rpx;
}

.spec-pill {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-height: 72rpx;
  max-width: 100%;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #050505;
  font-size: 27rpx;
  line-height: 1;
}

.spec-pill text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec-pill.active {
  background: #050505;
  color: #ffffff;
}

.spec-pill.disabled {
  background: #eeeeee;
  color: #9a9a9a;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 36rpx;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 26rpx 28rpx;
  border-radius: 26rpx;
  background: #f8f8f8;
}

.info-card text:first-child {
  color: #050505;
  font-size: 28rpx;
  font-weight: 600;
  line-height: 1.25;
}

.info-card text:last-child {
  color: #666666;
  font-size: 26rpx;
  line-height: 1.45;
}

.auth-feedback {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 28rpx;
  padding: 24rpx 28rpx;
  border-radius: 26rpx;
  background: #f8f8f8;
}

.auth-feedback text:first-child {
  color: #050505;
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1.35;
}

.auth-feedback text:last-child {
  color: #9a9a9a;
  font-size: 24rpx;
  line-height: 1.45;
}

.detail-cta {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 8;
  box-sizing: border-box;
  display: flex;
  gap: 18rpx;
  padding: 22rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -12rpx 32rpx rgba(0, 0, 0, 0.06);
}

.detail-cta .primary-button {
  flex: 1 1 0;
  width: auto;
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  width: 100%;
  min-height: 100rpx;
  padding: 0 16rpx 0 38rpx;
  border-radius: 999rpx;
  background: #050505;
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 1;
  box-shadow: 0 18rpx 36rpx rgba(5, 5, 5, 0.16);
}

.secondary-bag-button {
  flex: 0 0 250rpx;
  min-width: 0;
  min-height: 100rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #050505;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 100rpx;
}

.disabledButton {
  background: #9a9a9a;
  box-shadow: none;
}

.button-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 28rpx;
  line-height: 1;
}

.modal-layer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  background: rgba(5, 5, 5, 0.48);
}

.modal-sheet {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: 48rpx 32rpx calc(34rpx + env(safe-area-inset-bottom));
  border-top-left-radius: 38rpx;
  border-top-right-radius: 38rpx;
  background: #ffffff;
  box-shadow: 0 -24rpx 64rpx rgba(0, 0, 0, 0.12);
}

.modal-close {
  position: absolute;
  top: 24rpx;
  right: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  padding: 0;
  border-radius: 999rpx;
  background: #f4f4f4;
  color: #050505;
}

.modal-close text {
  font-size: 40rpx;
  line-height: 1;
}

.modal-kicker {
  display: block;
  margin-bottom: 16rpx;
  color: #9a9a9a;
  font-size: 22rpx;
  letter-spacing: 4rpx;
  line-height: 1.2;
}

.modal-title {
  display: block;
  max-width: 520rpx;
  color: #050505;
  font-size: 62rpx;
  font-weight: 500;
  line-height: 1.12;
}

.modal-copy {
  display: block;
  margin-top: 22rpx;
  color: #666666;
  font-size: 30rpx;
  line-height: 1.55;
}

.modal-actions {
  display: flex;
  gap: 18rpx;
  margin-top: 30rpx;
}

.secondary-action,
.primary-button.compact {
  flex: 1 1 0;
  min-width: 0;
  min-height: 96rpx;
  padding: 0 26rpx;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 500;
  line-height: 96rpx;
}

.secondary-action {
  background: #f4f4f4;
  color: #050505;
}

.primary-button.compact {
  margin: 0;
  box-shadow: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 42rpx 32rpx;
  background: #f8f8f8;
}

.empty-title {
  margin-top: 48rpx;
  color: #222222;
  font-size: 40rpx;
  font-weight: 600;
  line-height: 1.3;
}

.empty-copy {
  color: #9a9a9a;
  font-size: 28rpx;
  line-height: 1.5;
}

@media (max-width: 390px) {
  .gallery-card,
  .loading-gallery {
    flex-basis: 620rpx;
    width: 620rpx;
    height: 900rpx;
  }

  .title,
  .detail-price {
    font-size: 62rpx;
  }
}
</style>
