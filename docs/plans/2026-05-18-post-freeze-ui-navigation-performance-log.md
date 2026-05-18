# 2026-05-18 冻结后 UI、导航与性能修复交付记录

## 0. 背景

本记录承接 `04826bc feat: freeze high fashion mini-program migration` 冻结基线之后的人工验收修复。

用户在微信开发者工具中验收时发现：

1. 客户首页顶部管理入口与微信原生胶囊、系统安全区存在视觉/触控冲突。
2. 管理工作台顶部与系统状态栏、微信胶囊存在重叠。
3. 从管理工作台进入商城后，客户底部导航返回首页会回到管理栈。
4. 商品列表切换感知延迟明显。
5. 多次切换页面后出现 `navigateTo:fail webview count limit exceed`。
6. 商品列表调用新增 `listPublishedProductSummaries` 时，若线上 `mallApi` 云函数未部署会返回 `Unsupported mallApi action`。

## 1. Repository Impact Map

### 1.1 本轮允许影响

```text
src/app/navigation.ts
src/app/routes.ts
src/pages/index/index.vue
src/pages/customer/product-list/index.vue
src/pages/owner/dashboard/index.vue
src/pages/owner/import-upload/index.vue
src/pages/owner/orders/index.vue
src/pages/owner/products/index.vue
src/features/cloudbase-mall/customer-product-list.ts
src/features/cloudbase-mall/cloudbase-mall.test.ts
src/services/cloudbase/mall-api-client.ts
src/services/cloudbase/mall-api-client.test.ts
src/services/auth/cloudbase-wechat-auth-service.test.ts
cloudfunctions/mallApi/mall-api-core.js
cloudfunctions/mallApi/mall-api-core.test.js
docs/contracts/api-contract.md
docs/quality/agent-failure-log.md
docs/plans/2026-05-18-post-freeze-ui-navigation-performance-log.md
```

### 1.2 本轮明确不影响

```text
src/domain/
backend/
package.json
pnpm-lock.yaml
真实订单确认规则
库存扣减/释放规则
OCR 批次/草稿确认规则
客户下单前浏览不触发登录的规则
下单时才触发微信登录/手机号授权的规则
```

## 2. 已完成修复

### 2.1 客户首页顶部入口

- 删除无功能的左侧圆形菜单入口。
- 将 `管理` 胶囊放到 `Oh My Fish / 管理工作台` 视觉语义附近。
- 首页顶部位置按安全区和微信胶囊位置动态计算，避免遮挡系统区域和微信原生胶囊。

### 2.2 管理工作台顶部布局

- 工作台顶部内容整体按状态栏安全高度下移。
- 将 `商城` 胶囊与 `管理工作台` 标题相邻，减少右上角微信胶囊冲突。
- 保留工作台业务卡片、入口卡片、底部导航结构。

### 2.3 管理进入客户界面后的栈语义

- 新增 `routes.customerHome`。
- 管理工作台进入商城使用 `reLaunch` 清理管理栈，进入客户界面后应按客户界面正常使用。
- 客户商品页返回首页使用 `redirectTo(routes.customerHome)`，不再 `navigateBack` 回管理工作台。

### 2.4 商品列表性能

- 客户商品页从 `reLaunch`/重复全量加载调整为 `redirectTo` + 页面级缓存。
- 有缓存时先立即渲染缓存，再后台静默刷新，降低切换等待感。
- 增加 `pendingRefresh`，避免同一页面生命周期内重复请求。
- 新增 `listPublishedProductSummaries` mallApi action，一次返回已发布商品和 `minPrice`，避免商品列表 `listPublishedProducts + N * listSkus`。

### 2.5 点击反馈

- 商品列表按钮、分类、筛选、排序、底部导航、商品卡增加轻量按压态。
- 商品卡进入详情增加 `navigatingProductId`，避免短时间重复点击同一商品。

### 2.6 webview 栈溢出修复

- 管理端底部同级导航从 `navigateTo` 改为 `redirectTo`。
- 当前 active tab 点击只滚回顶部，不再跳转自身。
- 管理端 `商城` 入口统一使用 `reLaunch` 进入客户界面。
- 全局 `src/app/navigation.ts` 的 `navigateTo` 增加安全兜底：
  - 目标页等于当前页时使用 `redirectTo`。
  - 页面栈达到安全阈值 8 层时使用 `redirectTo`。
  - 如仍遇到 `webview count limit exceed`，fallback 到 `redirectTo`。
- 搜索确认项目内裸 `uni.navigateTo` 只保留在 `src/app/navigation.ts` 安全封装内。

## 3. 已知部署注意事项

`listPublishedProductSummaries` 是本轮新增 CloudBase `mallApi` action。

如果微信开发者工具连接的是旧版线上云函数，会出现：

```text
Unsupported mallApi action: listPublishedProductSummaries
```

这表示前端代码已更新，但 CloudBase 云函数尚未部署到同一版本。正式验收前应部署 `cloudfunctions/mallApi`，或在继续优化时加入旧 action fallback。

## 4. 验证记录

本轮多次执行验证。最终状态如下：

```powershell
pnpm.cmd run lint
```

结果：通过。

```powershell
pnpm.cmd run type-check
```

结果：通过。

```powershell
pnpm.cmd run verify:full
```

结果：通过。包含：

- lint
- boundary-check
- 前端/云函数测试：29 files / 123 tests
- coverage
- type-check
- 后端测试：12 files / 46 tests
- backend build
- prod/all audit
- `build:mp-weixin`
- `scripts/e2e-smoke.mjs`

smoke 输出：

```text
E2E smoke passed: mp-weixin build artifacts and page routes are present.
```

## 5. 下次无损衔接入口

下次继续工作时优先检查：

1. 微信开发者工具是否已重新编译并清理旧页面栈。
2. `cloudfunctions/mallApi` 是否已部署包含 `listPublishedProductSummaries` 的版本。
3. 管理端底部导航、客户首页/商品页、商品列表/详情页是否仍无 `webview count limit exceed`。
4. 若继续做性能优化，优先补 `listPublishedProductSummaries` 的旧云函数 fallback，避免部署滞后影响人工验收。

## 6. 当前结论

本轮冻结后修复已落地并通过自动验证。业务主链路仍保持原合同：客户浏览不登录、下单才授权、OCR 到商品上架、订单确认与库存审计规则不变。
