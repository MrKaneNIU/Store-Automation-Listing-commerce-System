# 微信小程序商城企业级上线与持续迭代主 PRD

## 0. 文档定位

本文档是本项目从当前 MVP 走向企业产品级上线的主 PRD。后续所有真实后端、真实存储、真实微信能力、真实 OCR/AI、权限、订单运营、UI 重构、发布上线和持续迭代工作，都必须以本文档为总纲。

本 PRD 不替代每一轮具体任务 PRD。每个阶段进入实现前仍必须拆出阶段 PRD 或执行计划，并在任务开始前给出 Repository Impact Map 和 Execution Plan。

## 1. 当前基线

### 1.1 已完成业务基线

根据当前交付记录，项目已经完成以下 MVP 闭环：

```text
老板批量上传云 e 宝截图
-> Mock OCR 生成商品草稿
-> 老板复核、编辑、删除、确认草稿
-> 系统创建 SPU/SKU
-> 店员补商品图片
-> 老板上架商品
-> 客户浏览已上架商品
-> 客户通过 Mock 微信登录和手机号授权下单
-> 系统创建待商家确认订单并预占库存
-> 商家确认或取消订单
```

已实现并应继续保护的业务规则：

1. OCR MVP 字段限定为 `product_code`、`product_name`、`sale_price`、`spec`。
2. 同一 `productCode` 生成一个 SPU。
3. 同一 `productCode + spec` 生成一个 SKU。
4. 重复 SKU 行合并库存。
5. 缺必填字段草稿不能确认。
6. 已删除草稿不能进入商品创建。
7. 商品无主图或无 SKU 时不能上架。
8. 客户未登录可以浏览商品。
9. 只有点击下单时才触发登录和手机号授权。
10. 授权取消不能创建订单，也不能扣库存。
11. 下单必须预占 SKU 库存并防止超卖。
12. 只有 `pending_merchant_confirm` 订单可以确认或取消。
13. 取消待确认订单必须释放预占库存。

### 1.2 已完成工程基线

当前工程约束包括：

1. `pnpm.cmd run verify`：lint、边界检查、测试、覆盖率、类型检查、依赖审计。
2. `pnpm.cmd run verify:full`：在 `verify` 基础上构建微信小程序并运行 build artifact smoke。
3. `scripts/check-boundaries.mjs`：保护模块边界。
4. `.github/workflows/ci.yml`：提供 CI 基线。
5. `docs/architecture`、`docs/contracts`、`docs/testing`、`docs/quality`：提供工程治理文档。
6. 页面已经通过 page-facing ViewModel / Facade 方向收紧高风险 UI 边界。

### 1.3 当前未完成上线能力

当前仍不能视为可上线产品，原因包括：

1. build artifact smoke 不能替代微信开发者工具中的完整人工点击验收。
2. 仍缺真实持久化数据库。
3. 仍缺真实图片对象存储。
4. 仍缺真实微信登录、手机号授权后端和角色权限。
5. 仍缺真实 OCR/AI 异步识别链路。
6. 仍缺生产级订单、库存流水、审计日志和运营能力。
7. 仍缺发布、提审、回滚、监控、告警和数据备份 SOP。
8. 仍缺小程序隐私合规、合法域名、HTTPS、后台配置和上线资料清单。

## 2. 产品目标

### 2.1 总目标

把当前可运行的 MVP 打造成可上线、可维护、可审计、可回滚、可持续迭代，并能轻松重构 UI 的企业产品级微信小程序商城。

### 2.2 质量目标

1. 任何一轮业务功能变化都必须有 PRD、影响图、执行计划、测试策略和交付记录。
2. 任何一轮代码变化都必须保护当前主闭环。
3. 任何一轮 UI 改版默认不得改变 domain、features、services 合约。
4. 任何真实外部能力必须通过 services 或后端 provider 替换，不允许写入页面层。
5. 任何上线版本必须通过自动验证、微信开发者工具人工验收、发布检查和回滚准备。
6. 任何订单、库存、支付、授权和个人信息相关能力必须可审计、可追踪、可回滚。

## 3. 核心原则

### 3.1 分层原则

```text
pages
-> app / features / domain types

features
-> domain / services

services
-> domain types / external adapters

domain
-> no app / features / services / pages / uni API
```

页面只负责：

- 布局。
- 展示。
- 输入状态。
- 点击事件。
- 弹窗、toast、loading。
- 路由参数和跳转。
- 调用 page-facing ViewModel / Facade。

页面禁止：

- 直接访问数据库、repository、mockDb。
- 直接调用 mock auth、mock OCR、mock upload 等实现。
- 自己判断库存扣减、订单状态、草稿确认、商品上架。
- 生成 openid、customerId、手机号、OCR 行、上传 URL。
- 在 UI 重构时改变业务字段含义。

### 3.2 迭代原则

1. 每次只做一个阶段或一个阶段中的少量模块。
2. 每个模块完成后停下验证。
3. 不把真实后端、真实 OCR、支付、UI 重构混在同一轮。
4. 业务底座未稳定前，不做大规模视觉重构。
5. 大规模 UI 重构前，必须先有稳定 ViewModel / Facade 合约。
6. 所有新增能力必须有最小可验收闭环。

### 3.3 验证原则

每个模块至少满足：

```text
单元/契约测试
-> 集成/用例测试
-> pnpm.cmd run verify
-> 必要时 pnpm.cmd run verify:full
-> 必要时微信开发者工具人工验收
-> 交付记录
```

不得跳过测试、删除测试、弱化断言、修改 fixture 来掩盖失败。

## 4. 官方平台约束

上线必须遵守微信小程序平台规则。以下官方资料在 2026-05-08 重新核对过：

1. 微信开发者工具 CLI 支持上传代码，需要项目路径、版本号和描述，并可输出包体信息。
   - https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
2. 小程序只能与已配置通讯域名通信，涉及 `wx.request`、`wx.uploadFile`、`wx.downloadFile`、`wx.connectSocket`。
   - https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html
3. `wx.login` 获取的临时 code 必须发给服务端换取会话信息。
   - https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
4. 手机号授权需要通过服务端接口用临时 code 换取手机号。
   - https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html
5. 隐私授权需要处理 `wx.getPrivacySetting`、`wx.onNeedPrivacyAuthorization`、`wx.requirePrivacyAuthorize`、`wx.openPrivacyContract` 等流程。
   - https://developers.weixin.qq.com/miniprogram/dev/api/open-api/privacy/wx.getPrivacySetting.html

上线前必须完成：

1. 小程序后台基础信息配置。
2. 服务内容声明和用户隐私保护指引。
3. request/upload/download/socket 合法域名配置。
4. HTTPS 证书和 TLS 校验。
5. 微信开发者工具预览、真机调试、上传。
6. 提交审核。
7. 审核通过后发布。
8. 发布后监控和回滚准备。

## 5. 分阶段路线图

后续全部工作按以下阶段推进：

```text
Phase 0: 基线冻结与验收矩阵
Phase 1: UI 边界工程化收口
Phase 2: 真实后端与持久化
Phase 3: 真实图片对象存储
Phase 4: 真实微信授权与角色权限
Phase 5: 订单、库存、审计与运营能力
Phase 6: 真实 OCR/AI 异步识别
Phase 7: 产品级 UI 与设计系统重构
Phase 8: 上线发布、监控、回滚与持续迭代
```

任何阶段不得跨越其前置硬门禁。若业务上必须调整顺序，必须先更新本 PRD 或另写阶段决策记录。

## 6. Phase 0：基线冻结与验收矩阵

### 6.1 目标

把当前可运行 MVP 固定成后续所有改动的回归基线，并补齐微信开发者工具人工点击验收矩阵。

### 6.2 模块拆分

#### 模块 0.1：当前基线归档

任务：

1. 记录当前主闭环。
2. 记录当前 `verify` 和 `verify:full` 命令结果。
3. 记录当前已知未完成项。
4. 记录当前 dirty worktree 中与 UI 边界工程化相关的文件。
5. 如果准备进入多人或长期迭代，建立远程 Git 仓库和基线 tag。

验收：

- 有明确基线文档。
- 有当前验证命令结果。
- 有当前人工验收状态。
- 有回滚参考点。

测试：

```powershell
pnpm.cmd run verify
pnpm.cmd run verify:full
```

#### 模块 0.2：微信开发者工具人工验收矩阵

任务：

1. 用微信开发者工具导入 `dist/build/mp-weixin`。
2. 记录微信开发者工具版本、基础库版本、模拟器设备。
3. 关闭不必要的调试豁免，尽量模拟真实环境。
4. 编写老板、店员、客户三类角色验收脚本。
5. 对每一步记录：操作、预期、实际、截图、问题编号。

验收路径：

```text
老板上传截图
-> Mock OCR 生成草稿
-> 编辑、删除、确认草稿
-> 商品和 SKU 生成
-> 店员补图
-> 老板上架
-> 客户浏览
-> 客户授权下单
-> 商家确认订单
-> 商家取消订单并验证库存释放
```

验收：

- 至少完成一轮完整人工点击。
- 所有阻断问题进入缺陷清单。
- 非阻断问题进入后续优化列表。

#### 模块 0.3：缺陷分级与处理流程

缺陷等级：

1. P0：主链断裂、数据丢失、库存错误、订单错误、权限绕过。
2. P1：关键角色无法完成核心操作。
3. P2：提示、兼容、空状态、体验问题。
4. P3：非阻断视觉和文案问题。

验收：

- P0/P1 必须修复后才能进入真实后端阶段。
- P2/P3 可进入计划，但必须记录。

## 7. Phase 1：UI 边界工程化收口

### 7.1 目标

让后续 UI 重构只替换页面外壳，不触碰业务内核。

### 7.2 当前状态

根据 `docs/plans/2026-05-08-ui-boundary-engineering-delivery-log.md`，高风险页面 ViewModel / Facade 已有交付记录。但当前工作区仍显示相关文件未提交，因此进入后续阶段前必须先完成验证、审查和归档。

### 7.3 模块拆分

#### 模块 1.1：UI 边界交付复核

任务：

1. 复核 `customer-product-detail`、`owner-draft-review`、`owner-products`、`owner-orders`、`staff-image-tasks` 的 feature 合约。
2. 确认页面不直接导入 mock service、repository、mockDb。
3. 确认页面只保留布局、输入状态、事件和提示。
4. 补齐 `docs/architecture/system-overview.md` 中新增 feature 模块描述。

验收：

- 页面层无新增业务规则。
- ViewModel / Facade 合约稳定。
- 文档与代码结构一致。

测试：

```powershell
pnpm.cmd run boundary-check
pnpm.cmd test
pnpm.cmd run coverage
pnpm.cmd run verify
pnpm.cmd run verify:full
```

#### 模块 1.2：中风险页面收口

范围：

1. 客户商品列表页。
2. 老板截图导入页。

任务：

- 客户商品列表页沉淀商品列表 ViewModel 和最低价展示。
- 老板截图导入页沉淀 uploaded image descriptor 创建、OCR 批次创建结果摘要。

验收：

- 页面仍不直接调用底层 service。
- 截图导入行为不变。
- 客户列表只展示已上架商品。

#### 模块 1.3：UI 重构合约冻结

任务：

1. 为每个 page-facing ViewModel / Facade 写合约说明。
2. 明确哪些字段允许 UI 使用。
3. 明确哪些字段不能被 UI 修改。
4. 明确 UI 重构默认不得改动的合约。

验收：

- 后续 UI 改版可只看合约，不读完整业务实现。
- 合约有测试保护。

## 8. Phase 2：真实后端与持久化

### 8.1 目标

替换 in-memory mock persistence，让数据跨刷新、重启、设备和部署长期存在。

### 8.2 架构决策

1. 小程序不得直连数据库。
2. 新增后端 BFF/API 层。
3. 前端继续通过 feature/service 端口调用，不把 HTTP 请求写进页面。
4. Repository 接口先稳定，再替换真实实现。
5. 数据库 migration 必须可追踪、可回滚。

### 8.3 模块拆分

#### 模块 2.1：后端项目与环境基线

任务：

1. 选择后端技术栈。
2. 建立 API 项目结构。
3. 建立 dev/staging/prod 环境配置。
4. 建立 `.env.example`，不得提交真实 secret。
5. 建立健康检查接口。
6. 建立统一错误响应格式。

验收：

- 本地后端可启动。
- 健康检查通过。
- 缺少必要环境变量时启动失败并给出明确错误。

测试：

- 后端单元测试。
- 配置缺失负向测试。
- 健康检查 smoke。

#### 模块 2.2：数据库 schema 和 migration

核心表：

1. `ocr_batches`
2. `product_drafts`
3. `products`
4. `skus`
5. `orders`
6. `order_items`
7. `customers`
8. `merchant_users`
9. `staff_users`
10. `role_assignments`
11. `inventory_ledger`
12. `operation_audit_logs`
13. `uploaded_assets`
14. `ocr_jobs`

约束：

- 订单、库存、草稿、商品状态必须用枚举或约束保护。
- 金额使用整数分或定点数，不使用浮点数。
- 所有关键业务表必须有 `created_at`、`updated_at`。
- 操作日志不可随意删除。

验收：

- migration 可从空库创建完整 schema。
- migration 可在测试库重复运行。
- schema 有回滚策略或补偿策略。

测试：

- migration test。
- repository contract test。
- 数据约束负向测试。

#### 模块 2.3：Repository 端口真实实现

任务：

1. 抽象 mall repository 端口。
2. 保留 in-memory/mock 实现用于测试。
3. 新增 database repository 实现。
4. 所有 feature 只依赖 repository 端口。
5. 不修改页面。

验收：

- mock repository 和 database repository 通过同一套 contract tests。
- 主闭环在 database repository 下可跑通。

测试：

- repository contract tests。
- workflow integration tests。
- 事务回滚测试。

#### 模块 2.4：API 合约

API 分组：

1. OCR 批次 API。
2. 草稿 review API。
3. 商品/SKU API。
4. 图片任务 API。
5. 客户商品浏览 API。
6. 客户订单 API。
7. 商家订单 API。
8. 授权和角色 API。

验收：

- API 统一响应格式。
- API 错误码稳定。
- 前后端字段命名一致。
- API 不暴露内部异常和 secret。

测试：

- API contract tests。
- 权限负向测试。
- 输入校验测试。
- 幂等测试。

#### 模块 2.5：数据备份和恢复

任务：

1. 定义备份频率。
2. 定义恢复演练流程。
3. 定义误操作恢复边界。
4. 定义上线前备份。

验收：

- staging 完成一次恢复演练。
- 恢复记录写入交付文档。

## 9. Phase 3：真实图片对象存储

### 9.1 目标

把 mock upload 替换为真实图片上传、存储、访问和替换能力。

### 9.2 模块拆分

#### 模块 3.1：Upload Service 端口强化

任务：

1. 明确上传输入：文件路径、业务类型、来源角色、所属实体。
2. 明确上传输出：assetId、url、mimeType、size、checksum、status。
3. 明确失败类型：过大、格式不支持、网络失败、服务端失败、安全审核失败。

验收：

- 页面不关心对象存储实现。
- mock 和真实上传实现合约一致。

#### 模块 3.2：对象存储真实实现

任务：

1. 选择对象存储服务。
2. 建立 bucket/path 命名规范。
3. 建立签名上传或后端中转上传。
4. 建立图片读取 URL 策略。
5. 建立删除、替换、过期策略。

验收：

- 店员补图后刷新仍可看到图片。
- 商品主图和详情图可长期访问。
- 上传失败不会改变商品状态。

测试：

- upload service contract tests。
- 文件大小/格式负向测试。
- 网络失败重试测试。
- 小程序真机上传验收。

#### 模块 3.3：图片处理与安全

任务：

1. 限制文件大小。
2. 限制图片格式。
3. 生成缩略图或压缩图。
4. 记录上传人和用途。
5. 接入内容安全审核或预留审核状态。

验收：

- 非法图片不能进入商品发布。
- 图片处理失败有明确提示。

#### 模块 3.4：小程序域名配置

任务：

1. 配置 `request` 合法域名。
2. 配置 `uploadFile` 合法域名。
3. 配置 `downloadFile` 合法域名。
4. 若使用 websocket，配置 socket 合法域名。
5. 确认证书和 TLS 校验通过。

验收：

- 微信开发者工具关闭域名豁免后仍可上传和展示图片。
- 真机预览可上传和下载图片。

## 10. Phase 4：真实微信授权与角色权限

### 10.1 目标

把 Mock 微信授权替换为真实微信登录、手机号授权、客户会话、老板/店员权限体系。

### 10.2 模块拆分

#### 模块 4.1：真实微信登录

任务：

1. 小程序调用 `wx.login` 获取 code。
2. 前端 Auth Service 把 code 发到后端。
3. 后端调用微信接口换取 openid/session 信息。
4. 后端创建或更新 customer。
5. 后端签发业务 session/token。

验收：

- 未登录用户仍可浏览商品。
- 点击下单时才触发登录。
- 登录失败不创建订单。
- token 过期有明确处理。

测试：

- auth service tests。
- 后端登录接口 tests。
- code 无效/过期负向测试。
- session 过期测试。

#### 模块 4.2：真实手机号授权

任务：

1. 客户点击下单时触发手机号授权。
2. 前端拿到手机号临时 code。
3. 后端换取手机号。
4. 绑定 customer。
5. 创建订单时写入 `customerPhone` 和 customerId。

验收：

- 拒绝授权不创建订单。
- 授权成功后下单不要求手填手机号。
- 商家订单页仍能看到手机号。

测试：

- 授权拒绝测试。
- 授权成功测试。
- 手机号换取失败测试。
- 重复授权测试。

#### 模块 4.3：隐私授权与合规

任务：

1. 配置小程序用户隐私保护指引。
2. 声明手机号、图片、昵称等实际收集类型。
3. 使用 `wx.getPrivacySetting` 检查是否需要授权。
4. 使用 `wx.onNeedPrivacyAuthorization` 或等价流程处理隐私授权。
5. 提供查看隐私协议入口。

验收：

- 首次触发隐私敏感能力前有合规提示。
- 拒绝隐私协议时不调用隐私敏感 API。
- 新增隐私收集类型后可再次触发授权。

#### 模块 4.4：老板和店员账号

任务：

1. 建立老板账号绑定。
2. 建立店员账号邀请或绑定。
3. 建立角色表和权限表。
4. API 层强制权限校验。
5. 页面只做展示和跳转，不承担最终权限判断。

权限规则：

| 操作 | 老板 | 店员 | 客户 |
| --- | --- | --- | --- |
| 上传 OCR 截图 | 是 | 否 | 否 |
| 确认草稿 | 是 | 否 | 否 |
| 补商品图 | 是 | 是 | 否 |
| 上架商品 | 是 | 否 | 否 |
| 查看订单 | 是 | 按配置 | 自己订单 |
| 确认/取消订单 | 是 | 否 | 否 |
| 下单 | 否 | 否 | 是 |

验收：

- 店员不能越权上架。
- 客户不能访问商家接口。
- 前端隐藏入口不等于权限，后端必须拒绝越权请求。

测试：

- role permission matrix tests。
- API authorization negative tests。
- 页面入口可见性 tests。

## 11. Phase 5：订单、库存、审计与运营能力

### 11.1 目标

让订单和库存从 MVP 状态升级为真实经营可用状态。

### 11.2 模块拆分

#### 模块 5.1：库存流水

任务：

1. 引入 inventory ledger。
2. 记录库存预占、释放、确认消耗、人工调整。
3. 所有库存变化必须有来源业务单据。
4. 支持按 SKU 查询库存流水。

验收：

- 任一库存变化都能追踪原因。
- 订单取消能对应到库存释放流水。
- 库存余额可由流水校验。

测试：

- ledger unit tests。
- order reserve/release integration tests。
- 并发下单 tests。

#### 模块 5.2：订单幂等和防重复提交

任务：

1. 客户下单引入 idempotency key。
2. 后端重复请求返回同一结果或明确拒绝。
3. 页面按钮防重复提交只作为体验优化，不能替代后端幂等。

验收：

- 双击下单不会创建两笔订单。
- 网络重试不会重复扣库存。

#### 模块 5.3：订单运营

任务：

1. 订单列表按状态筛选。
2. 订单详情展示客户手机号、商品、SKU、数量、备注、操作记录。
3. 支持商家备注。
4. 支持客户订单历史。
5. 支持异常订单标记。

验收：

- 老板可以高效处理待确认订单。
- 客户可以查看自己的订单。
- 操作记录可审计。

#### 模块 5.4：操作审计日志

任务：

1. 记录关键操作人。
2. 记录操作前后状态。
3. 记录来源 IP/设备或可用上下文。
4. 记录失败操作。

必须审计：

- 草稿确认。
- 商品上架。
- 商品下架。
- 图片替换。
- 订单确认。
- 订单取消。
- 库存人工调整。
- 权限变更。

验收：

- P0/P1 问题可以从审计日志追溯。

## 12. Phase 6：真实 OCR/AI 异步识别

### 12.1 目标

把 Mock OCR 替换为真实 OCR/AI，同时保持页面和主 workflow 稳定。

### 12.2 模块拆分

#### 模块 6.1：OCR Job 状态机

状态：

```text
queued -> running -> succeeded
queued -> running -> failed
failed -> retrying -> running
```

任务：

1. 建立 `ocr_jobs`。
2. 批次和 OCR job 关联。
3. 支持失败原因。
4. 支持重试。
5. 支持进度查询。

验收：

- 识别失败不会生成错误商品。
- 重试不会重复创建草稿。

#### 模块 6.2：真实 OCR Provider

任务：

1. 选择 OCR/AI 服务。
2. 实现 provider 接口。
3. 保留 mock provider 用于本地和测试。
4. 处理超时、限流、异常、费用。

验收：

- 真实截图可生成草稿。
- 低置信度字段进入待人工确认。
- provider 失败有清晰提示。

测试：

- provider contract tests。
- provider fake server tests。
- 失败和超时 tests。
- 大批次测试。

#### 模块 6.3：草稿质量与人工校正

任务：

1. 记录字段置信度。
2. 记录字段来源截图。
3. 标记冲突字段。
4. 支持人工校正。

验收：

- 老板可以明确知道哪些字段需要复核。
- 人工校正后再确认。

#### 模块 6.4：OCR 成本与限流

任务：

1. 每批次记录识别数量。
2. 记录 provider 成本或调用次数。
3. 限制单次批量上传数量。
4. 异常高频调用告警。

验收：

- 不会因误操作产生不可控费用。

## 13. Phase 7：产品级 UI 与设计系统重构

### 13.1 前置条件

进入大规模 UI 重构前必须满足：

1. UI 边界工程化已完成并验证。
2. 真实存储和图片链路稳定。
3. 真实授权和权限链路稳定。
4. 主闭环通过微信开发者工具人工验收。
5. page-facing ViewModel / Facade 合约冻结。

### 13.2 模块拆分

#### 模块 7.1：设计系统基础

任务：

1. 定义颜色、字号、间距、圆角、边框、阴影。
2. 定义状态色：成功、警告、错误、禁用、处理中。
3. 定义按钮、标签、列表、卡片、弹窗、空状态。
4. 不新增不必要依赖；如需新增必须先说明理由。

验收：

- 三端页面视觉一致。
- 文案中文优先。
- 移动端文字不溢出。

#### 模块 7.2：老板工作台 UI

重点页面：

1. 草稿确认页。
2. 商品管理页。
3. 订单确认页。

优化目标：

- 高密度但清晰。
- 批量处理效率高。
- 风险提示醒目。
- 状态分组明确。

验收：

- 老板能在最少步骤内完成导入、确认、上架、处理订单。
- UI 改版不改变业务规则。

#### 模块 7.3：店员补图 UI

优化目标：

- 待补图任务清晰。
- 按货号/批次搜索。
- 主图和详情图上传状态清晰。
- 错误可恢复。

#### 模块 7.4：客户商城 UI

优化目标：

- 商品列表适合手机浏览。
- 商品详情突出主图、价格、规格、库存。
- 微信授权下单流程自然。
- 授权取消或失败提示友好。

#### 模块 7.5：UI 回归测试

测试：

1. ViewModel / Facade tests 不变。
2. 页面 smoke tests。
3. 微信开发者工具人工主链验收。
4. 关键页面截图对比或人工截图归档。

验收：

- UI 重构后所有业务验收路径通过。
- `verify:full` 通过。

## 14. Phase 8：上线发布、监控、回滚与持续迭代

### 14.1 目标

建立稳定发布流程，让每次上线可追踪、可审核、可回滚。

### 14.2 模块拆分

#### 模块 8.1：远程仓库和分支保护

任务：

1. 建立远程 Git 仓库。
2. 配置 main/release 分支保护。
3. CI 必须通过才能合并。
4. 禁止直接推送生产分支。

验收：

- PR 合并前必须通过 required checks。

#### 模块 8.2：发布流水线

流程：

```text
feature branch
-> PRD / Impact Map / Execution Plan
-> implementation
-> verify
-> verify:full
-> 微信开发者工具人工验收
-> release branch
-> CLI upload
-> 提交审核
-> 审核通过发布
-> 发布后监控
-> 交付记录归档
```

验收：

- 每次发布有版本号、描述、变更清单、验证证据。
- 上传包体大小有记录。

#### 模块 8.3：环境管理

环境：

1. local。
2. dev。
3. staging。
4. production。

要求：

- 环境变量分离。
- secret 不入库。
- staging 数据可重置。
- production 有备份。

#### 模块 8.4：监控和告警

必须监控：

- API 错误率。
- 登录失败率。
- 手机号授权失败率。
- 下单失败率。
- 库存扣减失败。
- OCR job 失败率。
- 图片上传失败率。
- 慢接口。
- 数据库连接和容量。

验收：

- P0/P1 问题有告警渠道。
- 发布后 24-48 小时有观察记录。

#### 模块 8.5：回滚 SOP

任务：

1. 前端小程序版本回滚流程。
2. 后端服务回滚流程。
3. 数据库 migration 回滚或补偿流程。
4. 对象存储误删恢复流程。
5. 配置错误恢复流程。

验收：

- staging 至少演练一次回滚。
- 每次生产发布前有回滚点。

## 15. 企业级测试体系

### 15.1 测试分层

```text
Domain tests
-> Feature / ViewModel tests
-> Service contract tests
-> Repository contract tests
-> API contract tests
-> Integration tests
-> Build artifact smoke
-> WeChat DevTools manual acceptance
-> Production monitoring
```

### 15.2 必须持续保护的主链断言

1. 不完整草稿不能确认。
2. 重复确认不会重复创建商品/SKU。
3. 重复 SKU 合并库存。
4. 无主图商品不能上架。
5. 客户只能看到已上架商品。
6. 未登录可浏览。
7. 点击下单才授权。
8. 授权取消不创建订单、不扣库存。
9. 下单不能超卖。
10. 取消待确认订单释放库存。
11. 已确认订单不能取消。
12. 店员不能越权上架或确认订单。
13. 客户不能访问商家接口。
14. UI 重构不能改变 ViewModel / Facade 合约。

### 15.3 每阶段测试要求

| 阶段 | 最低测试要求 | 必须人工验收 |
| --- | --- | --- |
| Phase 0 | `verify`、`verify:full` | 是 |
| Phase 1 | ViewModel/Facade tests、boundary、`verify:full` | 高风险页面需要 |
| Phase 2 | repository contract、API contract、migration、integration | 是 |
| Phase 3 | upload contract、真机上传、域名校验 | 是 |
| Phase 4 | auth、permission matrix、隐私授权 | 是 |
| Phase 5 | ledger、idempotency、并发下单、订单运营 | 是 |
| Phase 6 | OCR provider contract、job 状态机、失败重试 | 是 |
| Phase 7 | UI smoke、截图/人工验收、`verify:full` | 是 |
| Phase 8 | release dry-run、回滚演练、监控告警 | 是 |

### 15.4 命令基线

常规任务：

```powershell
pnpm.cmd run verify
```

触及页面、构建、小程序产物、发布配置：

```powershell
pnpm.cmd run verify:full
```

后端加入后，需要新增类似命令：

```powershell
pnpm.cmd run verify:backend
pnpm.cmd run verify:api
pnpm.cmd run verify:e2e
```

具体命令以阶段实现为准，但每次新增命令必须写入 `package.json` 或后端对应脚本，并同步到测试文档。

### 15.5 微信开发者工具人工验收要求

每次人工验收记录必须包含：

1. 验收日期。
2. 验收版本号。
3. 构建命令。
4. 微信开发者工具版本。
5. 基础库版本。
6. 设备/模拟器。
7. 验收账号/角色。
8. 操作步骤。
9. 预期结果。
10. 实际结果。
11. 截图或录屏位置。
12. 问题编号。
13. 是否阻断上线。

## 16. 安全与合规要求

### 16.1 Secret 管理

1. AppSecret、数据库密码、对象存储密钥、OCR Provider 密钥不得提交到仓库。
2. `.env.example` 只能放变量名和说明。
3. 生产 secret 只能通过部署平台或密钥管理系统注入。
4. 密钥泄露必须立即轮换。

### 16.2 输入校验

所有系统边界必须校验：

- API 请求体。
- 路由参数。
- 文件类型。
- 文件大小。
- 金额。
- SKU 数量。
- 订单状态。
- 权限角色。

### 16.3 个人信息

涉及个人信息：

- 手机号。
- openid。
- 客户订单。
- 收货或联系信息。
- 图片中可能包含的隐私信息。

要求：

- 收集前说明用途。
- 最小化收集。
- 后端权限校验。
- 日志脱敏。
- 不在前端持久化敏感数据。

## 17. 数据模型演进约束

### 17.1 字段兼容

未经阶段 PRD 批准，不得删除或改变以下字段含义：

- `productCode`
- `productName`
- `salePrice`
- `spec`
- `stock`
- `customerPhone`
- `customerId`
- `customerAuthSource`
- 订单状态
- 商品状态
- 草稿状态

### 17.2 Migration 约束

每个 migration 必须说明：

1. 变更原因。
2. 上线前置条件。
3. 回滚方式或补偿方式。
4. 数据校验 SQL 或脚本。
5. 对现有 API 的影响。

## 18. 文档与交付要求

每个阶段完成后必须更新：

1. 对应阶段 PRD 或执行计划。
2. `docs/plans/YYYY-MM-DD-*-delivery-log.md`。
3. `docs/architecture/system-overview.md`，如模块结构变化。
4. `docs/architecture/module-boundaries.md`，如边界变化。
5. `docs/contracts/domain-contract.md`，如业务合同变化。
6. `docs/testing/test-strategy.md`，如测试命令或策略变化。
7. `docs/quality/review-checklist.md`，如审核清单变化。

交付记录必须包含：

- 完成内容。
- 文件变更。
- 未改动的业务边界。
- 验证命令和结果。
- 人工验收结果。
- 剩余 gap。
- 下一轮建议。

## 19. 总体上线门禁

首次生产上线前必须全部满足：

1. `verify` 通过。
2. `verify:full` 通过。
3. 后端验证通过。
4. API contract tests 通过。
5. 数据库 migration 在 staging 通过。
6. 真实图片上传下载通过。
7. 真实微信登录通过。
8. 真实手机号授权通过。
9. 老板、店员、客户权限矩阵通过。
10. 订单和库存主链通过。
11. OCR 链路通过或明确仍使用人工/mock 模式且产品范围允许。
12. 微信开发者工具完整人工验收通过。
13. 合法域名配置完成。
14. 隐私保护指引配置完成。
15. 生产 secret 配置完成。
16. 数据库备份策略完成。
17. 回滚 SOP 完成。
18. 发布说明完成。
19. 提交审核资料完成。
20. 生产监控和告警完成。

任何一项不满足，都不能声明企业级上线完成。

## 20. 推荐下一步

下一轮建议不要直接进入大规模后端改造。建议按顺序执行：

1. 复核并归档 UI 边界工程化当前工作区变更。
2. 建立微信开发者工具完整人工验收矩阵。
3. 用当前 mock 闭环跑一次完整人工验收。
4. 修复 P0/P1 缺陷。
5. 开始 Phase 2：真实后端与持久化 PRD。

只有当前主链在微信开发者工具里被完整点通，并且 UI 边界工程化被验证归档后，才进入真实后端和持久化。
