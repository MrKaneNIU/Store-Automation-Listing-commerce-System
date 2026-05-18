# 高端女装商城真实小程序视觉修复模块 4：管理工作台首页记录

## 0. 模块定位

本记录对应客户商品详情与下单授权视觉确认后进入的下一个小模块：管理工作台首页真实小程序视觉收敛。

本模块按 `docs/prd/2026-05-13-high-fashion-mall-real-miniprogram-safe-migration-prd.md` 的模块 E 执行，只处理 `src/pages/owner/dashboard/index.vue` 的 V4 管理工作台首页，以及为了避免原生导航与页面内顶部栏叠加而补充的 `pages.json` 页面导航配置。

本模块不进入模块 F 的跨页面底部导航统一修复，不修改商品管理独占页、订单确认独占页、截图识别页、草稿确认页或店员补图页的业务行为。

## 1. Repository Impact Map

### 1.1 本模块实际影响

```text
src/pages/owner/dashboard/index.vue
src/pages.json
docs/plans/2026-05-14-high-fashion-real-miniprogram-visual-repair-module-4-admin-dashboard-log.md
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

### 1.3 保留的页面跳转调用

```text
navigateTo(routes.ownerImportUpload)
navigateTo(routes.ownerDraftReview)
navigateTo(routes.staffImageTasks)
navigateTo(routes.ownerProducts)
navigateTo(routes.ownerOrders)
navigateTo(routes.customerProductList)
```

页面没有新增跨页面汇总查询，没有直接访问 repository、mockDb 或 CloudBase 集合，也没有新增真实统计数据模型。

## 2. 修复原因

管理工作台首页此前已具备 V4 雏形，但需要按 PRD 模块 E 收敛：

1. 顶部必须显示 `Oh My Fish / 管理工作台`，且 `管理工作台` 单行显示。
2. 右上角必须显示 `商城` 入口，用于返回客户商城。
3. 首页不能是传统后台 Dashboard 风格。
4. 工作台首页只展示 `截图识别 / 草稿确认 / 店员补图` 三个入口。
5. `商品管理 / 订单确认` 只保留在管理端底部导航，不作为首页入口卡重复出现。

同时，页面内已有顶部栏。如果继续保留原生 `老板工作台` 导航栏，会与页面内 `Oh My Fish / 管理工作台` 顶部信息叠加，因此本模块在 `src/pages.json` 中为 `pages/owner/dashboard/index` 补入 `navigationStyle: "custom"`，作为视觉修复必要配置。

## 3. 实施内容

1. 将工作台首页收敛为高端女装商城风格：浅灰底、黑白主色、高留白、圆角卡片、轻阴影。
2. 顶部保持 `Oh My Fish` kicker 和单行 `管理工作台` 标题。
3. 右上角 `商城` 入口继续跳转 `routes.customerProductList`。
4. 将 `业务流进度`、进度摘要和三个入口包裹在同一个 `flow-section` 下，符合“业务流模块下方三个入口”的信息结构。
5. 截图识别指标按 V4 规则表达为 `可上传 {{ remainingUploadCount }} 张`，本模块仍使用静态样例数值：
   - `maxUploadCount = 18`
   - `selectedScreenshotCount = 5`
   - `remainingUploadCount = 13`
6. 草稿确认和店员补图继续使用静态业务摘要样例：
   - `待确认 6 条`
   - `待补图 4 件`
7. 工作台首页入口卡只保留三项：
   - 截图识别
   - 草稿确认
   - 店员补图
8. 底部导航继续显示：
   - 工作台
   - 商品管理
   - 订单确认

## 4. 业务合同复核

1. 未新增跨页面汇总查询。
2. 未新增真实统计数据结构。
3. 未修改截图识别、草稿确认、店员补图、商品管理、订单确认的 feature 或 service。
4. 未修改商品、SKU、库存、订单、授权、权限链路。
5. 未把商品管理和订单确认作为首页入口卡重复展示。
6. 受保护业务层 diff 为空。

复核命令：

```powershell
git diff -- src/domain src/features src/services backend cloudfunctions package.json pnpm-lock.yaml
```

结果：输出为空。

## 5. 编译产物复核

已通过 `pnpm.cmd run verify:full` 中的 `build:mp-weixin` 生成小程序产物。

编译产物确认：

```text
dist/build/mp-weixin/pages/owner/dashboard/index.json
```

已输出 `navigationStyle: "custom"`。

`dist/build/mp-weixin/pages/owner/dashboard/index.wxml` 已包含关键结构与文案：

```text
Oh My Fish
管理工作台
商城
业务流进度
可上传
截图识别
草稿确认
店员补图
商品管理
订单确认
```

## 6. 自动验证

已运行：

```powershell
pnpm.cmd run build:mp-weixin
pnpm.cmd run verify
pnpm.cmd run verify:full
```

结果：

1. `build:mp-weixin` 通过。
2. `verify` 通过：lint、boundary-check、前端/云函数测试 29 files / 120 tests、coverage、type-check、后端测试 12 files / 46 tests、backend build、prod/all audit 均通过。
3. `verify:full` 通过：包含完整 `verify`、`build:mp-weixin` 和 `scripts/e2e-smoke.mjs`。
4. mp-weixin smoke 通过：`E2E smoke passed: mp-weixin build artifacts and page routes are present.`

## 7. 未完成的人工验收

本模块已经完成自动验证和编译产物检查，但尚未在微信开发者工具中完成真实视觉验收。

用户需要重点检查：

1. 管理工作台页是否不再出现原生 `老板工作台` 顶栏叠加。
2. 顶部是否显示 `Oh My Fish / 管理工作台`，且 `管理工作台` 单行。
3. 右上角 `商城` 是否可返回客户商城。
4. 页面整体是否不是传统后台 Dashboard 风格。
5. 工作台首页入口是否只有 `截图识别 / 草稿确认 / 店员补图` 三项。
6. `商品管理 / 订单确认` 是否只在底部导航出现。
7. 底部导航是否不遮挡页面内容。
8. 375px、390px、414px 宽度是否无横向滚动。

## 8. 下一步建议

用户确认管理工作台首页后，再进入模块 F：管理端底部导航真实迁移。不要在用户确认前继续修复商品管理或订单确认独占页。
