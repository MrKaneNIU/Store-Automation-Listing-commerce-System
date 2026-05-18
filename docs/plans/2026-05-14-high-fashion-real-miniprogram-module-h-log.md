# 高端女装商城真实小程序迁移模块 H 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 H：订单确认独占页真实迁移。

模块 H 的目标是将 `src/pages/owner/orders/index.vue` 迁移为高定商城订单卡片页，同时保留订单查询、确认订单、取消订单能力，不改变订单状态流、库存扣减与审计规则。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/owner/orders/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-h-log.md
```

### 1.2 本模块明确不影响

```text
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
src/pages.json
package.json
pnpm-lock.yaml
```

### 1.3 必须保留的调用

```text
getCloudBaseOwnerOrdersView()
confirmCloudBaseOwnerOrder(orderId)
cancelCloudBaseOwnerOrder(orderId)
navigateTo(routes.ownerDashboard)
navigateTo(routes.ownerProducts)
navigateTo(routes.ownerOrders)
```

## 2. 实施内容

1. 将订单确认页从简单列表迁移为高定商城订单卡片页：顶部品牌栏、订单概览、订单卡片列表、商品明细面板、金额与动作区、空状态。
2. 订单卡只使用现有 `Order` / `OwnerOrderListItem` 字段展示客户信息、商品摘要、规格、数量、状态和金额。
3. 确认订单按钮继续只在 `order.canConfirm` 为真时展示，并调用 `confirm(order.id)`。
4. 取消订单按钮继续只在 `order.canCancel` 为真时展示，并调用 `cancel(order.id)`。
5. 保留模块 F 已落地的管理端底部导航，`订单确认` 为当前激活态，页面底部继续预留安全区，避免遮挡内容。
6. 页面只新增展示用 `pendingOrderCount`，没有新增订单字段、状态规则、库存规则、审计规则或 CloudBase 集合直连。

## 3. 保留业务合同

1. 订单查询仍由 `getCloudBaseOwnerOrdersView()` 返回的 ViewModel 驱动。
2. 确认订单仍走 `confirmCloudBaseOwnerOrder(orderId)`。
3. 取消订单仍走 `cancelCloudBaseOwnerOrder(orderId)`。
4. 页面不直接读取 repository、mockDb 或 CloudBase 集合。
5. 页面不新增支付、物流、退款、优惠券能力。
6. 页面不改变订单状态流、库存扣减与审计规则。
7. 未修改 `src/pages.json`，未新增全局 tabBar。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 页面不以传统表格为第一视觉 | 已迁移为订单概览与订单卡片列表 |
| 订单卡展示客户信息、商品摘要、规格、数量、状态、金额 | 使用现有 `customerName`、`customerPhone`、`items`、`statusLabel`、`totalAmount` 展示 |
| 确认动作仍走现有 facade | 保留 `confirmCloudBaseOwnerOrder(orderId)` |
| 取消动作仍走现有 facade | 保留 `cancelCloudBaseOwnerOrder(orderId)` |
| 不改变库存扣减与审计规则 | 未修改 domain、feature、service、backend 或 cloudfunctions |
| 不在客户页面重复展示管理端订单卡 | 仅修改 `src/pages/owner/orders/index.vue` |
| 底部导航不遮挡内容 | `.page` 保留 `calc(188rpx + env(safe-area-inset-bottom))` 底部 padding |
| `pnpm.cmd run verify` | 通过：lint、boundary-check、前端/云函数测试 29 个文件 120 条、coverage、type-check、后端测试 12 个文件 46 条、backend build、prod/all audit 均通过 |
| `pnpm.cmd run verify:full` | 本轮首次执行时在包装命令内部遇到 Node/V8 原生崩溃 `v8::ToLocalChecked Empty MaybeLocal`，不是业务断言失败；随后拆分执行 `pnpm.cmd run e2e:smoke` 通过，包含 `build:mp-weixin` 与 `scripts/e2e-smoke.mjs`，小程序构建产物和页面路由 smoke 均通过 |
| 受保护业务路径 diff | 通过：`git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml` 输出为空；`src/pages.json` 存在前序视觉模块的 `navigationStyle: custom` 变更，本模块未新增修改 |
| 编译产物抽查 | 通过：`dist/build/mp-weixin/pages/owner/orders/index.wxml` 包含 `订单确认`、`MERCHANT REVIEW`、`ORDER`、`取消订单`、`确认订单`、`合计`、`工作台`、`商品管理`；`index.wxss` 包含 `order-card`、`items-panel`、`primary`、`secondary`、`admin-nav`、`border-radius` |

## 5. 下一步

模块 H 已完成代码验证。等待用户人工验收模块 H。用户验收通过前，不进入模块 I。
