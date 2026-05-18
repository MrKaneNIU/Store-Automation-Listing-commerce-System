# 高端女装商城真实小程序视觉修复模块 5：管理端底部导航记录

## 0. 模块定位

本记录对应 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 F：管理端底部导航真实迁移。

本模块目标是在管理端三个主页面落地一致的页面内底部导航：

```text
工作台 / 商品管理 / 订单确认
```

本次执行发现：在前序视觉迁移中，三个管理端主页面已经具备一致的页面内底部导航结构和样式。因此模块 F 采用审计、验证和记录的安全收口方式，不再制造额外代码改动。

## 1. Repository Impact Map

### 1.1 本模块实际影响

```text
docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-5-admin-bottom-nav-log.md
```

### 1.2 本模块审计范围

```text
src/pages/owner/dashboard/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
```

### 1.3 本模块明确不影响

```text
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
package.json
pnpm-lock.yaml
src/pages.json
```

本模块未修改全局 tabBar，未修改 `src/pages.json`，未新增页面路由，未调整业务 feature 或 service。

## 2. PRD 验收点复核

### 2.1 三个管理端页面之间可切换

三个页面均存在同一组底部导航跳转：

```text
navigateTo(routes.ownerDashboard)
navigateTo(routes.ownerProducts)
navigateTo(routes.ownerOrders)
```

复核结果：

1. `src/pages/owner/dashboard/index.vue`：`工作台` active，`商品管理 / 订单确认` 可跳转。
2. `src/pages/owner/products/index.vue`：`商品管理` active，`工作台 / 订单确认` 可跳转。
3. `src/pages/owner/orders/index.vue`：`订单确认` active，`工作台 / 商品管理` 可跳转。

### 2.2 底部导航不包含截图识别、草稿确认、店员补图

底部导航仅包含：

```text
工作台
商品管理
订单确认
```

`截图识别 / 草稿确认 / 店员补图` 只保留在工作台首页业务流模块中，不进入底部导航。

### 2.3 底部导航不遮挡内容

三个页面均有一致的页面底部预留：

```css
padding: 32rpx 32rpx calc(188rpx + env(safe-area-inset-bottom));
```

三个页面底部导航均使用一致尺寸：

```css
right: 24rpx;
bottom: calc(20rpx + env(safe-area-inset-bottom));
left: 24rpx;
min-height: 124rpx;
padding: 12rpx;
border-radius: 38rpx;
```

三个页面导航项均使用一致尺寸：

```css
min-height: 92rpx;
line-height: 92rpx;
```

### 2.4 不修改全局 tabBar 或 src/pages.json

本模块未编辑 `src/pages.json`。当前 `src/pages.json` 中已有 diff 来自前序模块的自定义导航配置，本模块没有新增或改变该文件。

## 3. 编译产物复核

已在 `dist/build/mp-weixin` 编译产物中确认三个管理端页面均输出底部导航：

```text
dist/build/mp-weixin/pages/owner/dashboard/index.wxml
dist/build/mp-weixin/pages/owner/products/index.wxml
dist/build/mp-weixin/pages/owner/orders/index.wxml
```

产物中均包含：

```text
工作台
商品管理
订单确认
```

并确认：

1. 工作台页还包含 `截图识别 / 草稿确认 / 店员补图` 业务流入口。
2. 商品管理页不把 `截图识别 / 草稿确认 / 店员补图` 放入底部导航。
3. 订单确认页不把 `截图识别 / 草稿确认 / 店员补图` 放入底部导航。

## 4. 业务合同复核

1. 未修改商品管理查询、筛选、单品上架、批量上架能力。
2. 未修改订单查询、确认订单、取消订单能力。
3. 未修改截图识别、草稿确认、店员补图入口能力。
4. 未修改客户商城浏览、下单授权、订单创建、库存扣减链路。
5. 未新增真实数据模型、状态字段、API 或 CloudBase 集合访问。
6. 受保护业务层 diff 为空。

复核命令：

```powershell
git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml
```

结果：输出为空。

## 5. 自动验证

已运行：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

结果：

1. `verify` 通过：lint、boundary-check、前端/云函数测试 29 files / 120 tests、coverage、type-check、后端测试 12 files / 46 tests、backend build、prod/all audit 均通过。
2. `verify:full` 通过：包含完整 `verify`、`build:mp-weixin` 和 `scripts/e2e-smoke.mjs`。
3. mp-weixin smoke 通过：`E2E smoke passed: mp-weixin build artifacts and page routes are present.`

## 6. 未完成的人工验收

本模块已经完成代码审计、编译产物检查和自动验证，但尚未在微信开发者工具中完成真实视觉验收。

用户需要重点检查：

1. 管理工作台、商品管理、订单确认三页底部导航高度和圆角是否一致。
2. 三页 active 状态是否分别对应当前页面。
3. 点击 `工作台 / 商品管理 / 订单确认` 是否能在三页之间切换。
4. 底部导航是否不包含 `截图识别 / 草稿确认 / 店员补图`。
5. 底部导航是否不遮挡页面内容。
6. 375px、390px、414px 宽度是否无横向滚动。

## 7. 下一步建议

用户确认模块 F 后，再进入模块 G：商品管理独占页真实迁移。模块 G 才允许继续收敛商品管理页主体视觉，但仍必须保留状态筛选、单品上架、批量上架链路。
