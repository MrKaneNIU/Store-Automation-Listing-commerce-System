# 高端女装商城真实小程序视觉修复模块 3：客户商品详情与下单授权记录

## 0. 模块定位

本记录对应用户确认首页与商品列表视觉修复后进入的下一个小模块：客户商品详情页与下单授权弹层视觉对齐。

本模块只处理客户商品详情页的视觉结构、页面内自定义导航、SKU 展示、固定下单按钮和下单授权弹层，不进入购物袋、收藏、我的、订单详情或管理工作台后续页面，不新增真实购物袋、收藏、地址、支付、优惠券、物流、退款等业务模型。

## 1. Repository Impact Map

### 1.1 本模块实际影响

```text
src/pages/customer/product-detail/index.vue
src/pages.json
docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-3-product-detail-log.md
```

### 1.2 本模块明确不影响

```text
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
package.json
pnpm-lock.yaml
```

### 1.3 保留的业务调用

```text
getCloudBaseCustomerProductDetailView(...)
selectCloudBaseCustomerProductSku(...)
submitCloudBaseCustomerProductDetailOrder(...)
```

详情页继续通过现有 CloudBase customer product detail facade 获取 ViewModel、选择 SKU、提交订单。页面没有新增 repository、mockDb 或 CloudBase 集合直接写入，也没有绕过现有下单授权链路。

## 2. 修复原因

真实小程序商品详情页此前仍偏基础工程卡片样式，与已经确认的高端女装商城 HTTP 原型中的商品详情视觉差异较大：缺少页面内高留白顶部栏、横向大图画廊、黑白女装视觉占位、SKU 胶囊、服务说明卡片、固定底部下单 CTA 和统一风格的底部授权弹层。

同时，详情页现在有页面内自定义顶部栏。如果继续保留小程序原生 `商品详情` 导航栏，会与页面内 `商品详情` 顶栏叠加，导致真实视觉偏离原型。因此本次在 `src/pages.json` 中给详情页补入 `navigationStyle: "custom"`，该变更是本模块视觉修复的必要配置。

## 3. 实施内容

1. 将 `src/pages/customer/product-detail/index.vue` 调整为高端女装商品详情结构：返回按钮、居中标题、更多视觉入口。
2. 增加横向详情画廊：优先展示真实 `mainImageUrl`，无图时使用黑白女装视觉占位。
3. 商品信息继续来自真实 ViewModel：商品名、货号、SKU、价格、库存、是否可提交订单均不复制原型假数据。
4. SKU 选择改为胶囊按钮，并保留原有 `sku.isSelected`、`sku.isDisabled` 状态。
5. 增加已选规格、库存状态、配送说明、下单授权说明等视觉模块。
6. 将底部下单按钮固定为 `微信手机号下单`，并根据 `viewModel.canSubmitOrder` 展示不可提交态。
7. 将原生 `uni.showModal` 替换为页面内高端风格授权底部弹层，但仍通过原有 Promise 回调返回授权确认或取消结果。
8. 授权弹层按钮为 `暂不授权` 和 `授权`，取消授权仍返回 false。

## 4. 业务合同复核

1. 浏览商品详情不会触发登录。
2. 只有点击下单后才进入 `submitCloudBaseCustomerProductDetailOrder(...)`，并按原顺序触发登录确认与手机号授权确认。
3. 用户点击 `暂不授权` 或关闭弹层时，授权 Promise 返回 false，不创建订单。
4. SKU、价格、库存、禁用态仍来自现有 ViewModel。
5. 未新增购物袋、收藏、地址、支付、优惠券、物流、退款等真实数据结构。
6. 未修改订单创建、库存扣减、OCR、草稿确认、补图、商品上架、订单确认等链路。
7. 受保护业务层 diff 为空。

复核命令：

```powershell
git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml
```

结果：输出为空。

## 5. 编译产物复核

已通过 `pnpm.cmd run verify:full` 中的 `build:mp-weixin` 生成小程序产物。

编译产物确认：

```text
dist/build/mp-weixin/pages/customer/product-detail/index.json
```

已输出：

```json
{
  "navigationBarTitleText": "商品详情",
  "navigationStyle": "custom",
  "usingComponents": {}
}
```

同时 `dist/build/mp-weixin/pages/customer/product-detail/index.wxml` 已包含关键结构与文案：

```text
商品详情
SKU
微信手机号下单
配送说明
下单前需要授权
暂不授权
授权
```

`dist/build/mp-weixin/pages/customer/product-detail/index.wxss` 已包含关键样式：

```text
detail-gallery
spec-pill
detail-cta
modal-layer
```

## 6. 自动验证

已运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

结果：

1. `verify` 通过：lint、boundary-check、前端/云函数测试 29 files / 120 tests、coverage、type-check、后端测试 12 files / 46 tests、backend build、prod/all audit 均通过。
2. `verify:full` 通过：包含完整 `verify`、`build:mp-weixin` 和 `scripts/e2e-smoke.mjs`。
3. mp-weixin smoke 通过：`E2E smoke passed: mp-weixin build artifacts and page routes are present.`

## 7. 未完成的人工验收

本模块已经完成自动验证、受保护层 diff 检查和编译产物检查，但尚未在微信开发者工具中完成真实视觉验收。

用户需要重点检查：

1. 商品详情页是否不再出现原生 `商品详情` 顶栏叠加。
2. 页面顶部、横向画廊、商品标题、价格、SKU 胶囊是否接近已确认的黑白高端女装商城风格。
3. 长商品名、长规格名、无图商品是否不破版。
4. SKU 选择、售罄禁用态是否仍可用。
5. 浏览详情页是否不会弹出登录或手机号授权。
6. 点击 `微信手机号下单` 是否出现页面内授权底部弹层。
7. 点击 `暂不授权` 或关闭弹层是否不会创建订单。
8. 授权后订单提交反馈是否仍按原链路展示。
9. 固定底部 CTA 是否不遮挡内容，375px、390px、414px 宽度是否无横向滚动。

## 8. 下一步建议

用户确认商品详情与下单授权视觉后，再进入下一个视觉修复模块。不要在用户确认前继续修复其他页面。
