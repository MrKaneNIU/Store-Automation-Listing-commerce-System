# 高端女装商城真实小程序视觉修复模块 2：客户商品列表记录

## 0. 模块定位

本记录对应用户确认首页修复后进入的下一个小模块：客户商品列表页视觉对齐。

本次不处理商品详情、管理端或任何业务链路，只把客户商品列表页从基础工程列表修复为接近 HTTP 原型 `catalog-screen` 的黑白、高留白、高端女装商城目录视觉。

## 1. Repository Impact Map

### 1.1 本模块实际影响

```text
src/pages/customer/product-list/index.vue
src/pages.json
docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-2-product-list-log.md
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
getCloudBaseCustomerProductListView()
uni.navigateTo({ url: `/pages/customer/product-detail/index?id=${productId}` })
```

商品列表没有新增 repository、mockDb、CloudBase 集合直接访问，也没有新增登录、手机号授权、订单、库存、收藏、购物袋、地址、支付、优惠券、物流或退款相关真实业务模型。

## 2. 修复原因

真实小程序商品列表页此前仍偏基础列表视觉，缺少此前 HTTP 原型已确认的目录页结构：顶部目录栏、品牌名、分类胶囊、筛选/排序工具、商品双列卡片和客户底部导航。

同时，商品列表页现在有页面内顶部导航。如果继续保留小程序原生 `商品列表` 导航栏，会与页面内 `新品目录` 顶栏叠加，导致真实视觉偏离原型。因此本次在 `src/pages.json` 中给商品列表页补充 `navigationStyle: "custom"`，作为视觉修复必要配置。

## 3. 实施内容

1. 将 `src/pages/customer/product-list/index.vue` 调整为目录页结构：返回按钮、标题 `新品目录`、搜索入口、品牌 `Oh My Fish`。
2. 增加横向分类胶囊：`全部 / 连衣裙 / 外套 / 半裙 / 通勤`。
3. 增加筛选、排序和网格/列表展示工具区；当前仅保留视觉入口和 toast，不新增筛选排序业务。
4. 商品仍来自 `getCloudBaseCustomerProductListView()` 返回的真实 ViewModel。
5. 商品卡保留主图展示；无图时使用黑白灰女装视觉占位。
6. 点击商品仍进入现有商品详情页。
7. 增加客户底部视觉导航，当前页面高亮 `商品`。
8. `购物袋 / 收藏 / 我的` 仅作为视觉入口提示，不新增真实数据结构。

## 4. 业务合同复核

1. 客户浏览商品列表不会触发登录。
2. 商品列表仍只读取现有客户商品列表 ViewModel。
3. 商品详情跳转路径未改变。
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
dist/build/mp-weixin/pages/customer/product-list/index.json
```

已输出：

```json
{
  "navigationBarTitleText": "商品列表",
  "navigationStyle": "custom",
  "usingComponents": {}
}
```

同时 `dist/build/mp-weixin/pages/customer/product-list/index.wxml` 已包含关键结构与文案：`新品目录`、`Oh My Fish`、`筛选`、`暂无匹配商品`、`购物袋`。

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

本次已完成自动验证和编译产物检查，但尚未在微信开发者工具中完成真实截图验收。

用户仍需重点检查：

1. 商品列表页是否已不再出现原生 `商品列表` 顶栏。
2. 页面顶部是否显示 `新品目录 / Oh My Fish`。
3. 分类胶囊、筛选、排序和网格切换是否视觉稳定。
4. 商品卡是否双列展示，长商品名和无图商品不破版。
5. 点击商品是否能进入商品详情。
6. 底部导航是否遮挡内容。
7. 375px、390px、414px 宽度是否无横向滚动。

## 8. 下一步建议

用户确认商品列表页修复后，再进入视觉修复模块 3：客户商品详情与下单授权视觉对齐。不要在用户确认前继续修复其他页面。
