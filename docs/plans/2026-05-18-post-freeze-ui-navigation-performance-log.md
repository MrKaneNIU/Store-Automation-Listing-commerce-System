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

## 7. 2026-05-18 UI interface switching responsiveness follow-up

This follow-up starts directly from frozen baseline `7ec025a fix: stabilize post-freeze mini-program navigation` and narrows the scope to perceived UI switching speed. It does not change product, order, inventory, OCR, auth, CloudBase facade, backend, or cloud function contracts.

### 7.1 Repository Impact Map

Changed in this follow-up:

```text
src/app/navigation.ts
src/app/navigation.test.ts
src/pages/index/index.vue
src/pages/customer/product-list/index.vue
src/pages/owner/dashboard/index.vue
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
docs/plans/2026-05-18-post-freeze-ui-navigation-performance-log.md
```

Explicitly out of scope:

```text
src/domain/
src/features/
src/services/
backend/
cloudfunctions/
package.json
pnpm-lock.yaml
```

Preserved contracts:

- Customer browsing still does not trigger login.
- Checkout-time WeChat login and phone authorization remain unchanged.
- OCR draft creation, draft confirmation, product/SKU publishing, order confirmation, inventory, and audit rules remain unchanged.
- Shopping bag, favorites, and profile remain visual-only entries unless a later PRD opens those data models.

### 7.2 Completed Optimization

- Added a navigation-level pending request guard in `src/app/navigation.ts` so a second route change cannot queue while the first mini-program navigation request is still pending.
- Kept the existing stack-safety behavior: current-page targets or deep stacks still use `redirectTo`, and `webview count limit exceed` still falls back to `redirectTo`.
- Added `src/app/navigation.test.ts` coverage for duplicate target suppression, competing target suppression, completion release, and deep-stack redirect behavior.
- Added immediate local busy feedback to the customer home page when entering the product list or owner dashboard.
- Removed the customer product list home-tab timeout reset; the state now remains busy until the page actually leaves, avoiding a late second tap during slow switching.
- Added immediate busy feedback and duplicate-tap protection for owner dashboard entry cards, owner bottom navigation, owner products bottom navigation, owner orders bottom navigation, and the owner-to-shop entry.

### 7.3 Verification

TDD evidence:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/app/navigation.test.ts
```

- Initial RED: duplicate/competing pending navigation requests were not fully guarded.
- Final GREEN: `src/app/navigation.test.ts` passed 4 tests.

Full verification before the final UI-lock tightening:

```powershell
pnpm.cmd run verify
```

Result: passed.

Included:

- lint
- boundary-check
- frontend/cloudfunction tests: 30 files / 127 tests
- coverage: all files 88% statements, 75.91% branches, 85.06% functions, 88% lines
- type-check
- backend tests: 12 files / 46 tests
- backend build
- prod/all audit: no known vulnerabilities

Post-tightening spot checks:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/app/navigation.test.ts
pnpm.cmd run lint
pnpm.cmd run type-check
```

Result: passed.

### 7.4 Remaining Gaps

- This is code-level and automated verification only; WeChat DevTools manual acceptance still needs a real click-through on device/tooling to judge perceived switching speed.
- `verify:full` was not rerun in this follow-up because no route table, build configuration, backend, cloud function, or package dependency changed after the already-passing `verify` run.

## 8. Customer Mall Detail Switching Follow-up

Manual acceptance after the first responsiveness pass showed a clear gap: the owner/admin workbench felt faster, but customer mall switching still felt slow on the product list/detail path.

Root cause:

- The previous optimization covered customer home to product list and product list to product detail.
- The customer product detail page was not included in the same interaction scheme.
- Detail entry could briefly render an empty/unavailable state while the CloudBase detail ViewModel loaded.
- Detail back navigation still used raw `uni.navigateBack({ delta: 1 })` with no local busy state, no duplicate-tap guard, and no fallback if the page stack was already abnormal.

Completed in this follow-up:

- Added a product-detail loading skeleton for the initial detail entry, so the page responds immediately while the existing CloudBase facade returns the ViewModel.
- Added busy state, duplicate-tap protection, and press feedback to both product-detail back buttons.
- Added a safe back fallback: if `navigateBack` fails, the customer detail page redirects to `routes.customerProductList`.
- Kept SKU selection and order-submit refreshes stable by avoiding full-page skeleton flashes after the initial entry.

Preserved contracts:

- Product detail still uses the existing customer detail ViewModel and CloudBase facade calls.
- Customer browsing still does not trigger login.
- WeChat login and phone authorization still happen only on order submit.
- Product, SKU, order, inventory, OCR, backend, cloud function, and package contracts were not changed.

Verification:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/app/navigation.test.ts
pnpm.cmd run lint
pnpm.cmd run type-check
pnpm.cmd run verify
pnpm.cmd run verify:full
```

Result: passed.

`verify:full` included `build:mp-weixin` and `scripts/e2e-smoke.mjs`; smoke confirmed the mini-program build artifacts and page routes are present.

## 9. Full UI Responsiveness Coverage Plan

The project-wide UI coverage audit found that the main customer and owner navigation paths were covered, but several workflow pages still missed the same immediate-feedback pattern. The follow-up will be executed in small steps.

### 9.1 Step 1 - Owner Import Upload Shop Navigation

Scope:

```text
src/pages/owner/import-upload/index.vue
```

Completed:

- Replaced the inline `relaunchTo(routes.customerProductList)` template call with a local `goShop()` handler.
- Added `isShopNavigating` as a local navigation lock.
- Added `busy` and `disabled` state to the shop button.
- Added lightweight opacity/transform feedback without changing upload, OCR, draft, CloudBase, or route contracts.

Preserved contracts:

- Screenshot selection and OCR recognition still use the existing upload service and CloudBase facade.
- OCR still creates drafts only and does not directly create products.
- The shop transition still uses `relaunchTo(routes.customerProductList)`.

### 9.2 Step 2 - Owner Import Upload Internal Actions

Scope:

```text
src/pages/owner/import-upload/index.vue
```

Completed:

- Added `isChoosingScreenshots` to prevent repeated native image-picker launches while selection is in progress.
- Added busy text and visual state to the screenshot selection button.
- Added a duplicate-tap guard and unified busy visual state to the OCR recognition button.
- Added press feedback to screenshot selection, OCR recognition, and screenshot deletion controls.
- Kept all motion lightweight with opacity/transform transitions only.

Preserved contracts:

- The upload service is unchanged.
- The CloudBase OCR facade is unchanged.
- Draft generation rules and OCR result handling are unchanged.

### 9.3 Step 3 - Owner Draft Review Responsiveness

Scope:

```text
src/pages/owner/draft-review/index.vue
```

Completed:

- Added an initial page loading skeleton for draft-review ViewModel loading.
- Added `pendingRefresh` so repeated `refreshView` calls reuse the in-flight request instead of stacking duplicate refreshes.
- Added `deletingDraftId` to prevent duplicate delete taps and show per-draft busy text.
- Added `isConfirmingBatch` to prevent duplicate batch-confirm taps and show confirming text.
- Added lightweight press feedback and busy states to delete and batch-confirm controls.

Preserved contracts:

- Draft editable fields are unchanged.
- Draft delete, update, and batch-confirm facade calls are unchanged.
- Product/SKU creation rules remain owned by the existing feature/facade layer.

### 9.4 Step 4 - Staff Image Tasks Responsiveness

Scope:

```text
src/pages/staff/image-tasks/index.vue
```

Completed:

- Added an initial loading skeleton before the staff image task ViewModel finishes loading.
- Added `pendingRefresh` so `onShow`, keyword search, and batch filter changes reuse an in-flight refresh instead of stacking duplicate requests.
- Added `supplementingProductId` so only one supplement action can run at a time.
- Added busy/disabled state and press feedback to the supplement button.

Preserved contracts:

- Staff image tasks still use the existing CloudBase facade call.
- Staff users still cannot enter draft review, product edit, or publish actions from this page.
- No new editing or publishing capability was added.

### 9.5 Step 5 - Owner Product and Order Async Actions

Scope:

```text
src/pages/owner/products/index.vue
src/pages/owner/orders/index.vue
```

Completed:

- Added a per-product publish lock and busy text for single product publish.
- Added a batch publish lock and busy text for ready-product batch publish.
- Disabled single publish while batch publish is in flight, and disabled batch publish while a single product is publishing.
- Added a shared order action lock for owner order confirm and cancel.
- Added per-action busy text for order confirmation and cancellation.
- Added lightweight press feedback and opacity/transform transitions to the affected buttons.
- Preserved the existing owner bottom navigation busy optimization.

Preserved contracts:

- Product publish still calls the existing CloudBase owner product facade.
- Batch publish still calls the existing ready-product publish facade.
- Order confirm and cancel still call the existing CloudBase owner order facade.
- Publish rules, order confirmation rules, inventory deduction/release, and audit behavior remain unchanged.

### 9.6 Manual Acceptance

Manual acceptance result:

- The UI responsiveness pass was accepted after the Step 5 owner product/order async-action update.
- User feedback: the interaction feel is good.

Current remaining gap:

- No further UI responsiveness coverage gap is known from the current manual pass.

## 10. Customer Browsing Unauthorized Error Follow-up

Observed symptom:

- During customer-side bottom navigation, WeChat DevTools showed `UNAUTHORIZED: Verified WeChat identity is required`.
- The yellow `wx.getSystemInfoSync is deprecated` console warning is not the blocking error.

Diagnosis:

- Customer home has no CloudBase data load.
- Customer product list loads published product summaries through the existing CloudBase customer browse facade.
- If that public product-summary call returns an unexpected CloudBase error, such as `UNAUTHORIZED`, the page-level refresh promise previously allowed the error to surface as a console red screen.
- This does not mean customer browsing should require login. The browsing contract remains: customer home/list/detail browsing stays open, and WeChat identity is still required only for checkout or protected owner/staff actions.

Completed:

- Added a customer product-list facade fallback for failed public product-summary loading.
- The product list now returns an empty product list with a recoverable message instead of surfacing the CloudBase exception to the page runtime.
- The product-list empty state now displays the ViewModel empty/error message and keeps the retry button.

Preserved contracts:

- No backend permission rule was weakened.
- The app still does not fabricate `openid`, customer identity, or owner/staff roles in page code.
- Checkout-time WeChat identity and phone authorization remain unchanged.
- Owner/staff protected actions still require verified identity and role assignment.

Verification:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/features/cloudbase-mall/cloudbase-mall.test.ts src/features/customer-product-list/customer-product-list.test.ts
pnpm.cmd run lint
pnpm.cmd run type-check
pnpm.cmd run verify
```

Result: passed.

## 11. Owner Dashboard Return Lock Follow-up

Observed symptom:

- After entering screenshot recognition, draft review, or staff image tasks from the owner dashboard, tapping the native back control returned to the dashboard but other dashboard buttons stayed disabled.
- Re-entering the dashboard from the customer mall reset the issue because a new dashboard page instance was created.

Root cause:

- The owner dashboard sets `navigatingRoute` before `navigateTo` to provide immediate busy feedback and duplicate-tap protection.
- When a subpage is opened with `navigateTo`, the dashboard page instance remains in the page stack.
- Returning with the native back control restores that same dashboard instance, but the local navigation lock was not reset on `onShow`.

Completed:

- Added owner dashboard `onShow` and `onHide` resets for `navigatingRoute` and `isShopNavigating`.
- Added a navigation `onComplete` callback so page-local navigation locks can be released after mini-program route calls finish.
- The owner dashboard entry navigation now releases its local lock from the navigation completion callback as well as page lifecycle callbacks.
- This keeps the duplicate-tap protection during entry navigation while avoiding a stuck dashboard after returning from subpages.

Preserved contracts:

- Screenshot upload/OCR, draft review, staff image tasks, owner product/order actions, CloudBase facades, and backend permission rules were not changed.

Verification:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/app/navigation.test.ts
pnpm.cmd run lint
pnpm.cmd run type-check
pnpm.cmd run test
pnpm.cmd run verify
pnpm.cmd run e2e:smoke
```

Result: passed.

`pnpm.cmd run verify:full` was attempted after the initial fix, but the inner `test` command hit a Node/V8 native crash after all tests had passed:

```text
FATAL ERROR: v8::ToLocalChecked Empty MaybeLocal
```

The underlying gates were rerun separately: `test` passed, `verify` passed, and `e2e:smoke` passed.

Follow-up hardening after manual retest still reproduced the stuck dashboard:

- Added `onComplete` support to `src/app/navigation.ts`.
- Added a regression test proving callers can release page-local navigation locks on navigation completion.
- The owner dashboard now releases entry locks through navigation completion, `onHide`, and `onShow`.

Verification after the hardening:

```powershell
pnpm.cmd exec vitest run --config vitest.config.ts src/app/navigation.test.ts
pnpm.cmd run lint
pnpm.cmd run type-check
pnpm.cmd run verify
pnpm.cmd run e2e:smoke
```

Result: passed. `verify` included 30 frontend/cloudfunction test files / 129 tests and 12 backend test files / 46 tests.

## 12. Customer Product List Safe Area Follow-up

Observed symptom:

- On the customer product list page, the top title and action buttons overlapped with the native status bar and WeChat mini-program capsule area on notched devices.

Root cause:

- The page used a fixed `28rpx` top padding for `.catalog-header`.
- Unlike the customer home and owner dashboard, this page did not calculate a runtime top offset from `uni.getMenuButtonBoundingClientRect` or status bar height.

Completed:

- Added runtime top padding for the customer product-list header.
- The page now prefers the WeChat capsule bottom position plus a small visual gap.
- If capsule information is unavailable, it falls back to `uni.getWindowInfo()` status bar height plus a conservative offset.
- The implementation follows the UI/UX Pro Max mobile safe-area checks: primary top controls are kept below the native status bar/capsule, existing 88rpx icon touch targets are preserved, and the page keeps horizontal overflow disabled.

Preserved contracts:

- Product loading, customer browsing, checkout auth timing, CloudBase facades, and backend rules were not changed.

## 13. Customer Product List Bottom Navigation Lock Regression

Observed symptom:

- After entering the customer product list page, the bottom navigation could no longer switch back to the customer home page.
- Other bottom navigation buttons also appeared unresponsive because the page was left in a local busy state while the global navigation guard could still be holding a pending route.

Root cause:

- The customer product list `goHome()` set `isHomeNavigating` before calling the shared `redirectTo()` helper.
- If the shared navigation guard already had a pending request, `redirectTo()` returned early without notifying the page.
- The page-local lock then stayed enabled, and the user could not recover from the product list page through the bottom navigation.
- A second risk existed in the shared guard itself: if the mini-program platform failed to call a route `complete` callback, global `pendingNavigationRoute` could remain stale and block later route requests.

Completed:

- Added `onFail` and `onComplete` support to shared `redirectTo()` and `relaunchTo()`.
- Shared navigation now invokes `onComplete` even when a new route request is blocked by an existing pending request, so page-local locks can release.
- Added a stale pending timeout to the shared navigation guard so a missing platform route callback cannot freeze navigation permanently.
- Updated customer product list home navigation to release its busy lock on completion, failure, `onShow`, and a short fallback timer.
- Added regression coverage for blocked redirected callers and stale pending navigation release.

Preserved contracts:

- Product loading, customer browsing, checkout auth timing, CloudBase facades, owner/staff permissions, OCR, order, inventory, and audit rules were not changed.

## 14. Customer Product List Header Alignment Follow-up

Observed request:

- Align the customer product list header to the manually marked red-line height.
- Keep all lower module spacing unchanged and move the lower modules upward only through the header start position.
- Move the search button next to the right side of the `新品目录` title.
- Make the search and back buttons slightly smaller and keep their inner glyphs visually centered.

Completed:

- Adjusted the customer product-list runtime header top offset to align the top module closer to the marked height.
- Preserved the existing spacing between the category rail, tool row, feedback/empty state, product grid, and bottom navigation.
- Grouped the title and search button into one centered title cluster so search sits beside `新品目录` instead of at the far right edge.
- Reduced the top circular icon buttons to 76rpx and centered the chevron/search glyphs.

Preserved contracts:

- No product loading, customer browsing, checkout auth timing, CloudBase facade, order, inventory, OCR, owner/staff permission, or audit logic was changed.
- No navigation lock behavior was changed in this visual-only alignment follow-up.

Verification:

```powershell
pnpm.cmd run lint
pnpm.cmd run type-check
pnpm.cmd run e2e:smoke
```

Result: passed.

## 15. Frozen Handoff Baseline After UI Responsiveness Pass

Baseline purpose:

- This commit is the handoff baseline after the post-freeze UI responsiveness, safe-area, and navigation-lock stabilization pass that started after `7ec025a`.
- The next worker can resume from this document and the committed code without reconstructing the click-through sequence from chat.

Implemented surface:

- Shared route helper now guards duplicate mini-program route requests, releases page-local locks through completion callbacks, and recovers stale pending navigation state.
- Customer home, customer product list, customer product detail, owner dashboard, owner import upload, owner draft review, staff image tasks, owner products, and owner orders have immediate press/busy feedback where the accepted pass required it.
- Customer product-list public load failures now degrade to an empty/retry state instead of surfacing protected CloudBase errors during open browsing.
- Product-list header now avoids the native status/capsule area, remains manually aligned to the accepted red-line height, and keeps the search control adjacent to the title.

Business contracts intentionally preserved:

- Customer browsing remains open and does not trigger login.
- WeChat login and phone authorization remain checkout-time behavior.
- OCR upload, OCR facade, draft generation, draft confirmation, SKU creation, product publish rules, order confirmation/cancellation, inventory, audit, CloudBase facade boundaries, backend, and cloud functions remain unchanged unless noted above.
- Staff users still do not receive new edit or publish capability from image-task pages.

Known working-tree note:

- Local untracked tooling/cache directories may exist (`.agents/`, `.playwright-mcp/`, `.superpowers/`, `skills-lock.json`) and are not part of this product baseline.
