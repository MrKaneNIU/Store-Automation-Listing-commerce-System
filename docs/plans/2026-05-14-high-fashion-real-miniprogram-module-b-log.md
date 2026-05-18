# 高端女装商城真实小程序迁移模块 B 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 B：客户首页与管理入口真实迁移。

模块 B 的目标是将工程入口页迁移为高端女装商城入口，同时保留客户商城入口和轻量管理入口，不触发登录、授权或权限逻辑。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/index/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-b-log.md
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
navigateTo(routes.customerProductList)
navigateTo(routes.ownerDashboard)
```

## 2. 实施内容

1. 将 `src/pages/index/index.vue` 从工程入口视觉改为高端女装商城首页入口。
2. 页面顶部保留品牌名 `Oh My Fish`。
3. 右上角保留轻量 `管理` 入口，继续跳转 `routes.ownerDashboard`。
4. 首页主操作为 `进入商城`，继续跳转 `routes.customerProductList`。
5. 移除首页上的 `店员补图` 直接入口，避免客户首页承载管理/店员工作流。
6. 使用黑白、高留白、圆角、轻阴影和商品视觉占位，避免紫蓝渐变、传统后台风格和整页 PNG 背景。
7. 增加 `env(safe-area-inset-bottom)` 底部安全区预留。

## 3. 保留业务合同

1. 客户进入商品列表仍通过现有路由和导航 helper。
2. 管理入口仍通过现有路由和导航 helper。
3. 首页不调用 CloudBase、repository、mockDb、登录、手机号授权或权限接口。
4. 不新增购物袋、收藏、个人中心、地址、支付、优惠券、物流、退款等业务模型。
5. 不修改客户浏览不登录、下单才授权的真实业务规则。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| 客户可进入商品列表 | `进入商城` 保留 `navigateTo(routes.customerProductList)` |
| 管理入口可进入工作台 | `管理` 保留 `navigateTo(routes.ownerDashboard)` |
| 不修改 `src/pages.json` | 已复核，未修改 |
| 不新增登录或授权 | 首页未新增任何登录、授权、权限调用 |
| `pnpm.cmd run verify` | 通过 |
| `pnpm.cmd run verify:full` | 通过 |

## 5. 验证证据

已运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

结果：

1. `verify` 通过：lint、boundary-check、29 个前端/云函数测试文件共 120 个测试、coverage、type-check、12 个后端测试文件共 46 个测试、backend build、`audit:prod`、`audit:all` 均通过。
2. `verify:full` 通过：再次执行 `verify` 后，`build:mp-weixin` 完成，`smoke:mp-weixin` 报告 `E2E smoke passed: mp-weixin build artifacts and page routes are present.`。
3. 受保护范围 diff 复核为空：

```powershell
git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml src/pages.json
```

## 6. 下一步

验证通过后，用户确认模块 B，才能进入模块 C：客户商品列表真实迁移。
