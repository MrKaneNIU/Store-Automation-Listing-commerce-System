# 高端女装商城真实小程序视觉修复模块 1：首页记录

## 0. 模块定位

本记录对应 2026-05-14 用户反馈：真实微信小程序中看到的界面与此前确认的浏览器预览样式不一致。

本次不进入新的业务迁移模块，只执行视觉修复模块 1：客户首页与客户底部导航对齐。修复目标是先让首页回到此前确认的黑白、高留白、高端女装商城视觉方向，并保留原有客户入口和管理入口。

## 1. Repository Impact Map

### 1.1 本模块实际影响

```text
src/pages/index/index.vue
src/pages.json
docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-1-home-log.md
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
navigateTo(routes.customerProductList)
navigateTo(routes.ownerDashboard)
```

首页没有新增 CloudBase、repository、mockDb、登录、手机号授权、订单、库存、收藏、购物袋、地址、支付、优惠券、物流或退款相关调用。

## 2. 修复原因

真实迁移后，首页仍受到原生导航栏和工程入口视觉影响，导致用户在微信小程序中看到的首屏不像此前确认的 HTTP 原型。

其中 `src/pages.json` 原模块 B 曾要求不修改，但本次属于用户发现真实视觉不一致后的修复。首页如果继续使用原生导航栏，会显示 `VX Close` 原生标题栏，压缩并破坏此前确认的沉浸式首页。因此本次将首页单页配置为自定义导航，作为视觉修复必要配置。

## 3. 实施内容

1. 将 `src/pages/index/index.vue` 调整为高端女装商城首页：大首屏视觉、黑白灰占位造型、顶部左侧菜单样式、右上角 `管理` 入口、主文案和 `查看新品` CTA。
2. 增加客户侧底部视觉导航：`首页 / 商品 / 购物袋 / 收藏 / 我的`。
3. `商品` 和 `查看新品` 保留跳转到现有客户商品列表。
4. `管理` 保留跳转到现有管理工作台。
5. `购物袋 / 收藏 / 我的` 仅作为视觉入口提示，不新增真实数据结构。
6. `src/pages.json` 仅给首页补充 `navigationStyle: "custom"`，避免原生标题栏破坏首屏视觉。

## 4. 业务合同复核

1. 客户浏览首页不会触发登录。
2. 客户进入商品列表仍走现有路由 helper。
3. 管理入口仍走现有管理工作台路由。
4. 未修改客户下单授权、取消授权、订单创建、库存扣减、OCR、草稿确认、补图、商品上架、订单确认链路。
5. 受保护业务层 diff 为空。

复核命令：

```powershell
git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml
```

结果：输出为空。

## 5. 编译产物复核

已运行：

```powershell
pnpm.cmd run build:mp-weixin
```

结果：通过。

编译产物确认：

```text
dist/build/mp-weixin/pages/index/index.json
```

已输出：

```json
{
  "navigationBarTitleText": "VX Close",
  "navigationStyle": "custom",
  "usingComponents": {}
}
```

同时 `dist/build/mp-weixin/pages/index/index.wxml` 已包含首页关键结构与文案：`管理`、`NEW SEASON`、`查看新品`、`购物袋`。

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

本次已完成自动验证和编译产物检查，但尚未在微信开发者工具中完成真实设备/模拟器截图验收。

用户仍需重点检查：

1. 首页是否已不再出现原生 `VX Close` 顶栏。
2. 首页首屏是否接近此前 HTTP 预览的黑白高端女装视觉。
3. 右上角 `管理` 是否能进入管理工作台。
4. `查看新品` 和底部 `商品` 是否能进入商品列表。
5. 底部导航是否遮挡内容。
6. 375px、390px、414px 宽度是否无横向滚动。

## 8. 下一步建议

用户确认首页修复后，再进入视觉修复模块 2：客户商品列表页对齐。不要在用户确认前继续修复其他页面。
