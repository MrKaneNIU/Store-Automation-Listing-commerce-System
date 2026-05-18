# 高端女装商城真实小程序迁移模块 E 执行记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 E：管理工作台首页真实迁移。

模块 E 的目标是将 `src/pages/owner/dashboard/index.vue` 迁移为 V4 管理工作台视觉，同时保留现有页面路由入口，不新增跨页面汇总查询或后台能力。

## 1. Repository Impact Map

### 1.1 本模块允许影响

```text
src/pages/owner/dashboard/index.vue
docs/plans/2026-05-14-high-fashion-real-miniprogram-module-e-log.md
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
navigateTo(routes.ownerImportUpload)
navigateTo(routes.ownerDraftReview)
navigateTo(routes.staffImageTasks)
navigateTo(routes.customerProductList)
```

`navigateTo(routes.ownerProducts)` 与 `navigateTo(routes.ownerOrders)` 按 PRD 不在模块 E 的工作台首页入口卡中重复展示，后续由管理端底部导航和独占页模块承接。

## 2. 实施内容

1. 将 `src/pages/owner/dashboard/index.vue` 从四按钮基础页迁移为 V4 管理工作台首页。
2. 顶部展示 `Oh My Fish` 和单行 `管理工作台`。
3. 右上角新增 `商城` 胶囊入口，继续使用现有 `navigateTo(routes.customerProductList)` 返回客户商城侧。
4. 新增 `业务流进度` 主模块，展示：

```text
截图识别：可上传 13 张
草稿确认：待确认 6 条
店员补图：待补图 4 件
```

5. 工作台首页只保留三个入口卡：

```text
截图识别
草稿确认
店员补图
```

6. 移除工作台首页中的 `商品管理` 和 `订单确认` 入口卡，避免与后续管理端底部导航独占页重复。
7. 页面使用黑白、高留白、圆角卡片、轻阴影和克制文字层级，不使用传统后台 Dashboard 表格风格。

## 3. 保留业务合同

1. 页面仍只通过 `navigateTo(...)` 进入现有页面。
2. 页面不直接读取 repository、mockDb 或 CloudBase 集合。
3. 页面不新增跨页面汇总查询。
4. 页面不新增商品管理、订单确认、OCR、草稿确认或补图业务能力。
5. 页面不新增登录、权限、上传、OCR、订单、支付、物流或审计逻辑。
6. `商品管理` 与 `订单确认` 不再作为工作台首页入口卡重复出现。

## 4. 验收记录

| 验收项 | 当前结果 |
| --- | --- |
| `管理工作台` 单行显示 | 顶部标题使用 `white-space: nowrap` |
| 不出现传统后台 Dashboard 风格 | 使用高端商城式 hero、业务流进度、圆角入口卡，无表格 |
| 工作台只展示三个入口 | 入口卡仅为 `截图识别 / 草稿确认 / 店员补图` |
| 商品管理和订单确认不作为首页入口卡重复出现 | 已从工作台首页入口卡中移除 |
| 保留截图识别入口 | 保留 `navigateTo(routes.ownerImportUpload)` |
| 保留草稿确认入口 | 保留 `navigateTo(routes.ownerDraftReview)` |
| 保留店员补图入口 | 使用现有 `navigateTo(routes.staffImageTasks)` |
| 保留商城返回入口 | 使用现有 `navigateTo(routes.customerProductList)` |
| `pnpm.cmd run verify` | 通过：lint、boundary-check、前端/云函数测试 29 个文件 120 条、coverage、type-check、后端测试 12 个文件 46 条、backend build、prod/all audit 均通过 |
| `pnpm.cmd run verify:full` | 通过：包含完整 `verify`，并完成 `build:mp-weixin` 与 `scripts/e2e-smoke.mjs`，小程序构建产物和页面路由 smoke 均通过 |
| 受保护路径 diff | 通过：`git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml src/pages.json` 输出为空 |

## 5. 下一步

模块 E 已完成代码验证。等待用户人工验收模块 E 后，才能进入模块 F：管理端底部导航真实迁移。
