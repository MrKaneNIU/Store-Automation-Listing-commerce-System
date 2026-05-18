# 高端女装商城真实小程序迁移模块 D 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 D：客户商品详情与下单授权视觉迁移。

模块 D 的目标是将商品详情页迁移为高端女装商品详情视觉，同时保留 SKU 选择、价格、库存禁用、下单授权和订单反馈链路。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/customer/product-detail/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-d-log.md
```

### 1.2 本模块明确不影响

```text
src/pages.json
src/app/routes.ts
src/app/navigation.ts
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
package.json
pnpm-lock.yaml
```

### 1.3 必须保留的调用

```text
getCloudBaseCustomerProductDetailView(...)
selectCloudBaseCustomerProductSku(...)
submitCloudBaseCustomerProductDetailOrder(...)
```

## 2. 实施内容

1. 将 `src/pages/customer/product-detail/index.vue` 从基础卡片页迁移为高端女装商品详情页。
2. 使用大图展示区、商品信息卡、规格选择卡、授权说明卡和底部固定下单按钮。
3. 增加无图商品占位，避免商品缺主图时破版。
4. 展示选中规格价格；未选中时展示最低规格价格起。
5. 保留规格选中态、无库存禁用态和库存文案，库存状态继续来自现有 ViewModel。
6. 保留 `message` 作为下单、授权取消、规格错误和订单反馈展示。
7. 页面加入底部 safe-area 预留，固定下单按钮不遮挡主要内容。

## 3. 保留业务合同

1. 浏览商品详情时只调用 `getCloudBaseCustomerProductDetailView(...)`，不触发登录或手机号授权。
2. 点击规格仍调用 `selectCloudBaseCustomerProductSku(...)`。
3. 点击下单后才调用 `submitCloudBaseCustomerProductDetailOrder(...)`。
4. 微信快捷登录确认仍通过 `confirmLogin` 注入。
5. 手机号授权确认仍通过 `confirmPhoneAuthorization` 注入。
6. 取消授权仍由既有 facade 返回取消状态和文案，页面不创建订单。
7. 页面不新增购物袋数据结构、购物袋按钮、收藏模型、地址模型、支付或物流能力。
8. 页面不直接读 repository、mockDb 或 CloudBase 集合。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 浏览商品不触发登录 | 浏览路径只调用 `getCloudBaseCustomerProductDetailView(...)` |
| 下单时才触发微信登录和手机号授权 | 授权确认仍只在 `submitOrder()` 内传入 `submitCloudBaseCustomerProductDetailOrder(...)` |
| 取消授权不创建订单 | 保留 facade 返回取消结果和 `message` 展示 |
| SKU 可选状态来自 ViewModel | 模板继续使用 `sku.isSelected`、`sku.isDisabled`、`sku.stock` |
| 页面不新增购物袋数据结构 | 未新增购物袋状态、数据模型或真实能力 |
| `pnpm.cmd run verify` | 通过：lint、boundary-check、前端/云函数测试 29 个文件 120 条、coverage、type-check、后端测试 12 个文件 46 条、backend build、prod/all audit 均通过 |
| `pnpm.cmd run verify:full` | 通过：包含完整 `verify`，并完成 `build:mp-weixin` 与 `scripts/e2e-smoke.mjs`，小程序构建产物和页面路由 smoke 均通过 |
| 受保护路径 diff | 通过：`git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml src/pages.json` 输出为空 |

## 5. 下一步

模块 D 已完成代码验证。等待用户人工验收模块 D 后，才能进入模块 E：管理工作台首页真实迁移。
