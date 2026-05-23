# 2026-05-22 管理工作台修复接力基线

## 适用范围

- PRD：`docs/prd/2026-05-21-admin-workbench-account-auth-prd.md`
- 当前目标：管理工作台账号登录、更多模块、权限管理、首页设置、账号管理的 PRD 实现与缺陷修复。
- 当前状态：模块 1 至模块 7 已完成自动化验证边界；随后针对截图/实测反馈做了多轮可见缺陷修复。
- 重要边界：本基线只记录管理工作台相关进度，不代表商品、订单、OCR、库存、上传等业务链路进入新需求范围。

## 已完成的 PRD 模块

### 模块 1：登录页与会话

- 新增管理工作台登录页 `/pages/login/index`。
- 新增运行期管理会话，默认初始账号仍为 `admin / 123456`。
- 管理入口无会话时进入登录页；有会话时进入工作台。
- App 启动时清空管理工作台会话，满足“小程序重新进入后重新要求登录”的 PRD 边界。

### 模块 2：工作台进入门禁

- 管理域页面统一接入 `ensureAdminWorkbenchSession(...)`。
- 未登录深链进入管理页时回到登录页。
- 会话账号被禁用时清会话并回登录页。
- 缺模块权限时进入无权限状态页，而不是只靠隐藏入口或停留空页。

### 模块 3：更多页与底部导航

- 管理底部导航固定为四项：工作台、商品管理、订单确认、更多。
- “更多”作为一级入口存在。
- “更多”页只放三个管理入口：权限管理、首页设置、账号管理。

### 模块 4：权限管理

- 支持创作者、店铺老板、员工三类角色。
- 支持创作者授权老板，老板在自身范围内授权员工。
- 支持禁用账号，并记录授权/禁用日志。
- 权限范围覆盖工作台进入权限、商品管理、订单确认、更多、首页设置、账号管理、权限管理。

### 模块 5：首页设置

- 支持首页背景、标题第一行、标题第二行、宣传内容的读取、预览、保存。
- 首页展示层读取首页设置，保存后再次展示首页会读取最新配置。
- 页面文案已修为面向管理者的首页展示配置文案，不再暴露 `DISPLAY ONLY`、`OCR`、`业务语义` 等内部措辞。

### 模块 6：账号管理

- 第一版只做修改密码。
- 修改密码必须校验旧密码、新密码长度、确认密码一致。
- 修改成功后当前会话失效，并直接回登录页。
- 页面进入和改密成功后会清空旧密码、新密码、确认密码，避免敏感输入残留。
- 未实现找回密码闭环，符合 PRD 第一版边界。

### 模块 7：验证与文档同步

- 原模块实现曾通过 `pnpm.cmd run verify:full`。
- 后续缺陷修复阶段每一步均做了 RED/GREEN 定向测试，并补跑 `type-check`、`lint`、`build:mp-weixin`、`smoke:mp-weixin`。
- 尚未完成微信开发者工具或真机人工验收。

## 已修复的反馈缺陷

### 2026-05-23 OCR 到补图链路

- 用户实测确认 OCR 已成功，提取信息正确，草稿明确接受后显示已就绪。
- 本轮修复“批量确认并创建商品 SKU 后未进入补图下一步”的断点。
- 根因是后续商品/补图链路仍残留旧微信身份校验，而管理工作台 OCR/草稿编辑已使用账号管理体系。
- `mallApi` 的 `confirmBatch`、`publishProduct`、`listPendingImageTasks`、`supplementProductImages` 已接入管理工作台 `adminSession + productManagement`。
- 草稿确认页在成功创建商品后会导航到店员补图页。
- 已新增契约测试覆盖管理工作台 session 从 OCR 草稿继续到 pending image tasks 的路径。
- 已部署线上 `mallApi`，并验证 `listPendingImageTasks` 使用管理 session、无微信 identity 时返回 `success: true`。
- 详细记录见 `docs/plans/2026-05-23-admin-workbench-ocr-to-image-task-handoff.md`。

### 启动与登录边界

- 修复小程序启动后直接进入管理登录页的问题：`pages/index/index` 是首个启动页，登录页只在点击管理入口且无会话时出现。
- 登录页不再预填或显示 `admin / 123456`。
- 登录页密码输入使用小程序 `password` 属性。
- 登录页主按钮对齐和可见 UI 已按截图反馈修复。

### 编码与中文显示

- 管理工作台底部导航中文不再显示为 `?????`。
- 已用 UTF-8 源码读取和构建产物检查区分“终端乱码”和“真实源码损伤”。
- 当前已知管理工作台相关页面未保留 `?????` 作为真实源码文案。

### 底部导航稳定性

- 四个 owner tab 页底部导航统一锁定 4 列布局。
- `.admin-nav .busy { transform: none; }` 避免切换时按钮缩放导致导航乱跳。
- 已有 `src/pages/owner/admin-nav-style.test.ts` 锁定几何规则。

### 更多页内容边界

- “更多”页只保留权限管理、首页设置、账号管理三项。
- 去掉“真实配置内容”“入口位”等开发占位措辞。
- More 页用户文案已改为面向后台配置的说明。

### 无权限状态

- 新增 `/pages/owner/no-permission/index`。
- 缺模块权限时 toast 提示后进入无权限状态页。
- 未登录、账号禁用仍保持回登录页，不混淆为无权限页。

### 权限管理可读性

- 权限管理页不再直接展示内部枚举，如 `creator`、`active`、`workbenchAccess`、`authorize`。
- 已增加中文展示标签，如创作者、店铺老板、员工、启用中、已禁用、工作台进入权限、授权、禁用。
- 业务判断仍保留内部枚举，不改变权限规则。

### 首页设置可读性

- 页面 hero 从 `DISPLAY ONLY` 改为 `首页展示`。
- 页面说明改为“调整首页背景、标题和宣传内容；商品、订单和上传识别流程保持不变。”
- 保存、预览和首页读取逻辑未改。

### 账号管理敏感输入

- 页面进入时清空旧密码、新密码、确认新密码。
- 改密成功后复用同一清理逻辑，再回登录页。
- 构建产物确认三个密码输入仍带 `password` 属性。

### 管理域跳转失败恢复

- 补充 `src/pages/owner/navigation-recovery.test.ts`，锁定管理域页面跳转完成、失败或被 pending navigation 拦截时必须恢复本地导航锁。
- 工作台、商品管理、订单确认、更多、无权限、权限管理、首页设置、账号管理页的 `redirectTo(...)` 导航已接入 `onComplete` 清理 `navigatingRoute`。
- 工作台、商品管理、订单确认、导入上传页回商城的 `relaunchTo(routes.customerProductList, ...)` 已接入 `onComplete` 清理 `isShopNavigating` 或 `navigatingRoute`。
- 商品管理、订单确认页进入 `onShow` 时会清理旧导航锁，避免返回同页时按钮残留 disabled 状态。
- 未改变登录、权限、商品、订单、OCR、上传、审核等业务判断和数据流。

## 关键文件

### PRD 与记录

- `docs/prd/2026-05-21-admin-workbench-account-auth-prd.md`
- `docs/plans/2026-05-21-admin-workbench-account-auth-log.md`
- `docs/plans/2026-05-22-admin-workbench-entry-nav-defect-fix.md`
- `docs/plans/2026-05-22-admin-workbench-repair-baseline.md`

### 路由与页面注册

- `src/pages.json`
- `src/app/routes.ts`
- `src/app/pages-config.test.ts`
- `src/app/routes-more.test.ts`

### 登录、会话、门禁

- `src/pages/login/index.vue`
- `src/pages/login/index.test.ts`
- `src/services/auth/admin-workbench-session.ts`
- `src/services/auth/admin-workbench-session.test.ts`
- `src/features/admin-workbench-auth/admin-workbench-auth.ts`
- `src/features/admin-workbench-auth/admin-workbench-auth.test.ts`
- `src/features/admin-workbench-auth/admin-workbench-entry.ts`
- `src/features/admin-workbench-auth/admin-workbench-entry.test.ts`
- `src/features/admin-workbench-auth/admin-workbench-guard.ts`
- `src/features/admin-workbench-auth/admin-workbench-guard.test.ts`

### 管理工作台页面

- `src/pages/owner/dashboard/index.vue`
- `src/pages/owner/products/index.vue`
- `src/pages/owner/orders/index.vue`
- `src/pages/owner/more/index.vue`
- `src/pages/owner/more/index.test.ts`
- `src/pages/owner/no-permission/index.vue`
- `src/pages/owner/admin-nav-style.test.ts`

### 权限管理

- `src/features/admin-permissions/admin-permissions.ts`
- `src/features/admin-permissions/admin-permissions.test.ts`
- `src/pages/owner/permissions/index.vue`
- `src/pages/owner/permissions/index.test.ts`

### 首页设置

- `src/features/homepage-settings/homepage-settings.ts`
- `src/features/homepage-settings/homepage-settings.test.ts`
- `src/pages/owner/homepage-settings/index.vue`
- `src/pages/owner/homepage-settings/index.test.ts`
- `src/pages/owner/navigation-recovery.test.ts`

### 账号管理

- `src/pages/owner/account-management/index.vue`
- `src/pages/owner/account-management/index.test.ts`

## 最近验证记录

后续修复阶段已分别跑过：

- `pnpm.cmd run test -- src/pages/owner/account-management/index.test.ts src/features/admin-workbench-auth/admin-workbench-auth.test.ts`
  - 最近结果：47 个测试文件、198 个测试通过。
- `pnpm.cmd run test -- src/pages/owner/homepage-settings/index.test.ts src/features/homepage-settings/homepage-settings.test.ts`
  - 结果：47 个测试文件、197 个测试通过。
- `pnpm.cmd run test -- src/features/admin-permissions/admin-permissions.test.ts src/pages/owner/permissions/index.test.ts`
  - 结果：46 个测试文件、196 个测试通过。
- `pnpm.cmd run test -- src/features/admin-workbench-auth/admin-workbench-guard.test.ts src/app/routes-more.test.ts src/app/pages-config.test.ts`
  - 结果：45 个测试文件、195 个测试通过。
- `pnpm.cmd run test -- src/pages/owner/more/index.test.ts src/pages/owner/admin-nav-style.test.ts src/app/routes-more.test.ts`
  - 结果：45 个测试文件、193 个测试通过。
- `pnpm.cmd run type-check`
  - 最近结果：通过。
- `pnpm.cmd run lint`
  - 最近结果：通过。
- `pnpm.cmd run build:mp-weixin`
  - 最近结果：通过。
- `pnpm.cmd run smoke:mp-weixin`
  - 最近结果：通过。
- `pnpm.cmd run test -- src/pages/owner/navigation-recovery.test.ts src/app/navigation.test.ts`
  - 最近结果：48 个测试文件、200 个测试通过。
- `pnpm.cmd run verify`
  - 最近结果：通过。此前 dev 依赖路径 `@dcloudio/vite-plugin-uni > express > qs` 命中 `GHSA-q8mj-m7cp-5q26` moderate 漏洞，已通过 `pnpm.overrides.qs = 6.15.2` 和锁文件刷新关闭。
- `pnpm.cmd run verify:full`
  - 最近结果：通过；末尾 smoke 输出 `E2E smoke passed: mp-weixin build artifacts and page routes are present.`
- `pnpm.cmd run verify:full`
  - 2026-05-23 OCR 到补图链路修复后结果：通过。前端/云函数 49 个测试文件、217 个测试通过；覆盖率 88.8%；后端 12 个测试文件、49 个测试通过；audit 无已知漏洞；`mp-weixin` build 与 smoke 通过。

注意：

- `build:mp-weixin` 和 `smoke:mp-weixin` 只代表自动化构建/路由 smoke，不代表人工验收。

## 当前未完成与风险

1. 微信开发者工具/真机人工验收尚未完成。
2. 当前管理账号、权限、首页设置仍是 MVP 运行期内存态实现，未接 CloudBase 持久化账号体系。
3. 未实现找回密码、第三方登录、微信登录或生产级账号安全能力。
4. 工作区当前存在大量未提交变更，其中包含本 PRD 模块、后续修复，以及更早的商品/OCR/草稿链路改动；下次提交前必须按文件范围拆分检查，不要把无关工作混入同一提交。

## 下一次建议接手顺序

1. 先打开本文件和 PRD，确认仍以管理工作台修复为目标。
2. 用微信开发者工具重新导入 `dist/build/mp-weixin` 做人工验收。
3. 人工验收优先路径：
   - 启动小程序，应进入客户首页，不应直接进登录页。
   - 点击首页“管理”，无会话时应进入管理登录页。
   - 登录页不应预填账号/密码。
   - 使用 `admin / 123456` 登录进入管理工作台。
   - 底部导航在工作台、商品管理、订单确认、更多之间切换不乱跳、不乱码。
   - 更多页只显示权限管理、首页设置、账号管理。
   - 无权限账号深链进入受限模块时出现无权限状态页。
   - 首页设置保存后，回首页应看到展示内容更新。
   - 账号管理改密成功后回登录页，旧密码不可登录，新密码可登录。
5. 人工验收通过后，再考虑整理提交或进入生产化账号持久化任务。

## 不要误判的状态

- `pnpm.cmd run smoke:mp-weixin` 通过不等于微信开发者工具人工验收通过。
- PowerShell 终端可能把中文显示成乱码；真实编码请用 Node/UTF-8 文件读取或构建产物确认。
- 当前“更多”“权限”“首页设置”“账号管理”仍是 PRD 第一版 MVP，不应被误认为生产级 CloudBase 权限中心。
