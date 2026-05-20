# 企业级上线风险分组推进 PRD

## 0. 文档定位

本文档承接 `docs/prd/2026-05-08-enterprise-launch-master-prd.md`，用于把当前剩余上线缺口从原来的 Phase 顺序，重排为按上线风险分组推进的执行总控 PRD。

本 PRD 不替代主 PRD，也不直接实现代码。每个风险组进入实施前仍必须拆出 Repository Impact Map、Execution Plan、交付日志和验证计划。

本 PRD 暂不覆盖 Phase 4 完整微信开发者工具人工验收。该验收仍是最终上线门禁的一部分，但不作为本轮风险分组推进的执行项。

## 1. 当前基线

### 1.1 当前可依赖状态

当前仓库基线为：

```text
282f24a perf: stabilize post-freeze ui responsiveness
```

该基线之后的事实边界：

1. Phase 0、Phase 1 已完成并有交付记录。
2. Phase 2 CloudBase 后端、云函数、云数据库集合、核心索引、CloudBase facade 接入已完成当前门禁。
3. Phase 3 CloudBase 图片对象存储已完成当前老板截图上传验收。
4. Phase 4 已完成真实微信身份边界、手机号绑定接口、角色权限、隐私服务边界的自动验证，但完整人工验收暂不纳入本 PRD 执行范围。
5. Phase 5 已完成库存流水、订单幂等和订单确认/取消审计主链。
6. 高端女装商城真实小程序迁移 A-L 已完成冻结。
7. 冻结后 UI 响应性、导航锁、safe-area 和商品列表/详情切换体验已完成当前人工验收反馈修复。

### 1.2 当前不能声明上线完成的原因

除 Phase 4 完整人工验收外，当前仍存在以下上线风险：

1. 真实 OCR/AI 异步识别链路尚未实现。
2. 生产 secret 和 CloudBase 函数环境配置尚未形成可验证门禁。
3. 订单运营能力仍缺商家备注、客户订单历史、异常订单标记、操作记录展示等完整经营能力。
4. 店员补图和商品主图/详情图的真实上传下载仍需要在稳定商品路径下复验。
5. 备份、恢复和回滚 SOP 仍主要是 runbook，缺少 staging 演练证据。
6. 合法域名、隐私保护指引、服务内容声明、审核资料和发布资料仍缺最终上线清单。
7. 远程仓库、分支保护、发布流水线、监控告警和发布后观察机制仍未闭环。

## 2. 推进原则

### 2.1 风险优先级

本 PRD 按上线风险从高到低推进：

```text
生产配置可验证
-> 真实 OCR/AI 主链
-> 订单运营补齐
-> 图片链路复验
-> 备份恢复回滚
-> 合规与发布资料
-> 发布流水线与监控
-> 最终上线 readiness gate
```

### 2.2 执行硬规则

1. 每次只进入一个风险组。
2. 每个风险组完成后必须停下更新交付日志。
3. 不得把 OCR、订单运营、发布、监控、合规混在同一轮实现。
4. 每个风险组必须先给出 Repository Impact Map 和 Execution Plan。
5. 每个代码风险组必须先写测试或契约，再实现。
6. 文档、配置、自动验证、人工验收必须分别记录，不得合并成一句“已通过”。
7. 未完成的风险组不得被包装成“上线完成”。
8. 如果某一风险组被产品决策降级为可延后，必须另写决策记录，说明上线范围、用户影响和补偿措施。

### 2.3 全局禁止事项

1. 禁止提交真实 `WECHAT_APPSECRET`、OCR provider key、CloudBase 密钥、数据库密码或任何生产 secret。
2. 禁止在页面层直接访问 CloudBase 集合、repository、mockDb、OCR provider 或 upload service 实现。
3. 禁止改变 `productCode`、`productName`、`salePrice`、`spec`、`stock`、`customerPhone`、`customerId`、`customerAuthSource`、订单状态、商品状态、草稿状态的业务含义，除非另开 PRD 并通过用户确认。
4. 禁止让失败 OCR 结果生成商品。
5. 禁止让 OCR 重试重复创建草稿。
6. 禁止绕过后端权限校验，只依赖前端隐藏入口。
7. 禁止删除测试、弱化断言、修改 fixture 来掩盖失败。
8. 禁止把 build artifact smoke 当作人工验收或发布验收。
9. 禁止把本地 PowerShell 环境变量当作生产 CloudBase 配置完成证据。
10. 禁止为本 PRD 顺手做视觉重构、购物袋、支付、物流、优惠券、退款、客服消息系统等非本轮能力。

## 3. 必须保持不变的业务合同

1. 客户浏览商品不触发登录。
2. 只有点击下单时才触发微信登录和手机号授权。
3. 授权取消不创建订单，也不扣库存。
4. OCR 上传只进入识别和草稿链路，不直接创建商品。
5. 草稿确认仍由现有 feature / workflow 控制。
6. 同一 `productCode` 生成一个 SPU。
7. 同一 `productCode + spec` 生成一个 SKU。
8. 重复 SKU 行合并库存。
9. 无主图或无 SKU 商品不能上架。
10. 下单必须预占 SKU 库存并防止超卖。
11. 只有 `pending_merchant_confirm` 订单可以确认或取消。
12. 取消待确认订单必须释放预占库存。
13. 店员不能越权上架商品或确认订单。
14. 客户不能访问商家接口。
15. 页面只调用 page-facing ViewModel / Facade，不新增直接 repository 写入。

## 4. 风险组 A：生产配置与 Secret 门禁

### 4.1 目标

建立一个可重复执行的生产配置检查门禁，让上线前能够明确知道 CloudBase 函数、微信能力、OCR provider 和存储域名是否配置齐全。

### 4.2 允许影响范围

允许：

```text
scripts/
docs/operations/
docs/plans/
docs/contracts/
package.json
```

`package.json` 仅允许新增只读检查命令。

禁止：

```text
src/pages/
src/features/
src/services/
src/domain/
backend/
cloudfunctions/业务逻辑
pnpm-lock.yaml，除非新增脚本依赖且经过单独确认
```

### 4.3 任务

1. 新增 CloudBase 函数环境变量只读检查。
2. 检查 `mallApi` 是否存在 `WECHAT_APPID`、`WECHAT_APPSECRET`、OCR provider 相关变量。
3. 检查变量存在性，不打印变量值。
4. 检查 CloudBase 环境 ID 是否与当前运行目标一致。
5. 检查 storage/domain/urlCheck 当前配置是否有上线阻断。
6. 输出机器可读和人工可读结果。
7. 更新生产配置 runbook。

### 4.4 验收标准

1. 缺少生产 secret 时，检查命令失败并说明缺少哪个变量名。
2. 命令输出不得包含 secret 值。
3. 文档明确生产 secret 只能配置在 CloudBase 控制台或平台密钥系统。
4. 本地环境变量只能作为本地调试输入，不能作为上线完成证据。
5. `pnpm.cmd run verify` 通过；如果只改文档和脚本，可运行脚本专项验证并说明未跑 `verify` 的理由。

## 5. 风险组 B：真实 OCR/AI 异步识别主链

### 5.1 目标

把当前非真实 OCR 路径升级为可上线评估的 OCR job 主链：

```text
截图上传
-> 创建 OCR job
-> 排队/识别中/成功/失败/重试
-> 生成待复核草稿
-> 管理员人工校正
-> 安全确认商品/SKU
```

### 5.2 允许影响范围

允许：

```text
src/domain/ocr 或现有 OCR domain 相关文件
src/services/repositories/
src/services/ocr/
src/features/cloudbase-mall/
src/features/owner-screenshot-import/
src/features/owner-draft-review/
src/pages/owner/import-upload/index.vue
src/pages/owner/draft-review/index.vue
cloudfunctions/mallApi/
backend/src/cloudbase/
docs/contracts/
docs/plans/
docs/testing/
```

禁止：

```text
src/pages/customer/
src/pages/owner/products/
src/pages/owner/orders/
src/pages/staff/
商品/SKU/库存/订单状态规则
支付、物流、退款、优惠券
大规模视觉重构
```

### 5.3 模块 B1：OCR Job 状态机

任务：

1. 建立或补齐 `ocr_jobs` 数据结构。
2. 状态限定为 `queued`、`running`、`succeeded`、`failed`、`retrying`。
3. job 必须关联 OCR batch。
4. job 必须记录失败原因、重试次数、创建时间、更新时间。
5. job 查询必须通过 `mallApi` 和 service/facade，不允许页面直连集合。

验收：

1. 状态流转非法时返回明确错误。
2. 失败 job 不生成商品。
3. 重试 job 不重复创建草稿。
4. repository contract tests 和 cloudfunction tests 通过。

### 5.4 模块 B2：OCR Provider 接口

任务：

1. 定义 provider 输入：图片 asset、批次、调用上下文。
2. 定义 provider 输出：字段值、字段置信度、字段来源、错误码。
3. 保留 fake/mock provider 用于测试。
4. 真实 provider 必须处理超时、限流、服务异常和格式异常。
5. provider secret 只通过生产配置注入。

验收：

1. fake provider contract tests 通过。
2. provider 超时不会卡死 job。
3. provider 失败返回可恢复错误。
4. provider 不直接写商品、SKU 或订单。

### 5.5 模块 B3：草稿质量与人工校正

任务：

1. 草稿字段只覆盖 `product_code`、`product_name`、`sale_price`、`spec`。
2. 记录字段置信度。
3. 标记低置信度、字段冲突、待补全。
4. 人工修改后记录已人工校正状态。
5. 批量确认前必须仍走现有草稿确认规则。

验收：

1. 低置信度字段不得自动当作安全字段确认。
2. 缺必填字段草稿仍不能确认。
3. 人工校正后再确认。
4. 现有商品/SKU 合并规则不变。

### 5.6 模块 B4：OCR UI 最小接入

任务：

1. 截图识别页展示 job 状态和失败原因。
2. 截图识别页支持查询进度和重试失败项。
3. 草稿确认页展示低置信度、冲突和人工校正标记。
4. 保持当前高端女装真实小程序视觉，不做全新视觉重构。

验收：

1. 管理员能从截图上传进入 OCR job。
2. 识别失败有明确下一步。
3. 重试不重复创建草稿。
4. `pnpm.cmd run verify` 和 `pnpm.cmd run verify:full` 通过。

## 6. 风险组 C：订单运营补齐

### 6.1 目标

在不引入支付、物流、退款和优惠券的前提下，补齐真实经营所需的订单运营能力。

### 6.2 允许影响范围

允许：

```text
src/domain/order/
src/domain/audit 或现有审计相关文件
src/services/repositories/
src/features/owner-orders/
src/features/cloudbase-mall/
src/pages/owner/orders/index.vue
src/pages/customer/ 如仅用于客户订单历史
cloudfunctions/mallApi/
docs/contracts/
docs/plans/
docs/testing/
```

禁止：

```text
支付
物流
退款
优惠券
购物袋
订单状态大改
库存扣减/释放语义大改
```

### 6.3 任务

1. 订单列表支持状态筛选。
2. 订单详情或订单卡展示客户手机号、商品、SKU、数量、备注、操作记录。
3. 支持商家备注。
4. 支持异常订单标记。
5. 支持客户查看自己的订单历史。
6. 关键订单操作写入操作审计日志。
7. 审计日志记录操作人、操作动作、前后状态、失败原因和可用上下文。

### 6.4 验收标准

1. 老板可以高效处理待确认订单。
2. 客户只能查看自己的订单。
3. 商家备注不影响库存、金额和订单状态。
4. 异常标记不改变订单状态流，除非另开 PRD。
5. 操作记录可追溯订单确认、取消、备注、异常标记。
6. `pnpm.cmd run verify` 和 `pnpm.cmd run verify:full` 通过。

## 7. 风险组 D：图片链路复验与补缺

### 7.1 目标

在稳定商品和补图任务路径存在后，重新验收真实图片上传、读取、替换、失败恢复和域名/TLS。

### 7.2 允许影响范围

优先只允许：

```text
docs/plans/
docs/operations/
```

如复验发现缺陷，允许最小修改：

```text
src/services/storage/
src/features/staff-image-tasks/
src/features/cloudbase-mall/staff-image-tasks*
src/pages/staff/image-tasks/index.vue
docs/contracts/
```

禁止：

```text
替换 CloudBase 存储方案
改变上传 service 合约
新增图片业务模型
改商品发布规则
```

### 7.3 验收标准

1. 店员补图真实上传成功。
2. 商品主图和详情图刷新后仍可访问。
3. 上传失败不会改变商品状态。
4. 临时 URL 或访问 URL 的 HTTPS/TLS 证据已记录。
5. 微信开发者工具关闭域名豁免后可上传和展示图片。
6. 如修改代码，`pnpm.cmd run verify:full` 通过。

## 8. 风险组 E：备份、恢复与回滚演练

### 8.1 目标

把现有 runbook 升级为有 staging 演练证据的上线门禁。

### 8.2 允许影响范围

允许：

```text
scripts/
docs/operations/
docs/plans/
package.json
```

`package.json` 仅允许新增备份、恢复、回滚检查命令。

禁止：

```text
业务代码
生产数据破坏性操作
未审批的生产恢复
```

### 8.3 任务

1. 定义 CloudBase 数据库备份检查清单。
2. 定义 CloudBase 云存储误删恢复或补偿流程。
3. 定义云函数版本回滚流程。
4. 定义小程序前端版本回滚流程。
5. 在 staging 或等价安全环境完成一次恢复演练。
6. 记录备份 ID、环境、操作者、开始时间、结束时间、验证结果。

### 8.4 验收标准

1. 没有 staging 演练证据，不得声明回滚 SOP 完成。
2. 每次生产发布前必须有回滚点。
3. 恢复演练不能使用生产数据做破坏性实验。
4. 回滚记录必须可供下一位执行者复现。

## 9. 风险组 F：合规与发布资料

### 9.1 目标

补齐微信小程序上线前后台配置、隐私合规、合法域名、审核资料和发布说明。

### 9.2 允许影响范围

允许：

```text
docs/operations/
docs/plans/
docs/contracts/
src/manifest.json，如仅同步已确认 AppID 或 urlCheck 配置
```

禁止：

```text
业务逻辑
页面视觉重构
真实 secret
未确认的 AppID 变更
```

### 9.3 任务

1. 建立小程序后台基础信息清单。
2. 建立服务内容声明清单。
3. 建立用户隐私保护指引清单。
4. 映射实际收集信息：手机号、openid、订单信息、图片中可能包含的隐私信息。
5. 建立 request/upload/download/socket 合法域名清单。
6. 记录 HTTPS/TLS 验证方式。
7. 准备提交审核资料。
8. 准备发布说明模板。

### 9.4 验收标准

1. 每个后台配置项都有状态：未配置、已配置、需人工确认、阻塞。
2. 文档不得记录真实 secret。
3. 隐私收集类型必须与实际功能一致。
4. 合法域名清单必须覆盖 CloudBase 云函数和云存储访问路径。
5. 审核资料和发布说明可直接交给操作者使用。

## 10. 风险组 G：发布流水线、远程仓库与监控告警

### 10.1 目标

建立可追踪、可审核、可回滚、可观察的发布体系。

### 10.2 允许影响范围

允许：

```text
.github/workflows/
scripts/
docs/operations/
docs/plans/
package.json
```

禁止：

```text
业务功能变更
页面视觉变更
生产分支无保护直推
无回滚点上传生产
```

### 10.3 任务

1. 建立远程 Git 仓库。
2. 建立 `main` / `release` 分支保护规则。
3. 将 `verify` 和 `verify:full` 纳入发布前 required checks 或人工 gate。
4. 定义版本号、变更说明、包体信息记录格式。
5. 定义微信开发者工具 CLI upload dry-run 或正式上传流程。
6. 定义提交审核流程。
7. 建立监控指标清单：
   - API 错误率。
   - 登录失败率。
   - 手机号授权失败率。
   - 下单失败率。
   - 库存扣减失败。
   - OCR job 失败率。
   - 图片上传失败率。
   - 慢接口。
   - CloudBase 云函数、云数据库、云存储容量和调用量。
8. 定义 P0/P1 告警渠道。
9. 定义发布后 24-48 小时观察记录。

### 10.4 验收标准

1. 没有远程仓库和分支保护，不得进入正式发布。
2. 没有监控告警，不得声明生产上线完成。
3. 没有回滚点，不得上传生产版本。
4. 每次发布必须有版本号、描述、变更清单、验证证据和观察记录。

## 11. 风险组 H：最终上线 Readiness Gate

### 11.1 目标

在不新增范围的前提下，对主 PRD 总体上线门禁做最终审计。

### 11.2 允许影响范围

允许：

```text
docs/plans/
docs/operations/
```

禁止：

```text
新增业务能力
新增 UI 范围
临时绕过测试
临时放宽上线门禁
```

### 11.3 必须检查的门禁

1. `pnpm.cmd run verify` 通过。
2. `pnpm.cmd run verify:full` 通过。
3. 后端验证通过。
4. API contract tests 通过。
5. CloudBase staging 环境集合、索引、权限和数据变更验证通过。
6. 真实图片上传下载通过。
7. 真实 OCR 链路通过，或另有批准的人工/mock 上线范围决策记录。
8. 订单和库存主链通过。
9. 合法域名配置完成。
10. 隐私保护指引配置完成。
11. 生产 secret 配置完成。
12. CloudBase 云数据库和云存储备份策略完成。
13. 回滚 SOP 完成。
14. 发布说明完成。
15. 提交审核资料完成。
16. 生产监控和告警完成。

Phase 4 完整人工验收虽不在本 PRD 执行范围内，但在最终上线 readiness gate 中必须以外部门禁形式明确状态。

### 11.4 输出

最终输出一份上线差距表：

```text
门禁项
当前状态：已满足 / 阻塞 / 可延后
证据位置
责任人或下一步
是否允许上线
```

## 12. 测试策略

### 12.1 测试原则

1. 测外部行为，不测内部实现细节。
2. 每个风险组优先补契约测试。
3. OCR、订单、上传、发布脚本必须有失败路径测试。
4. CloudBase 相关能力必须有本地 fake/store 测试和必要的 CloudBase smoke。
5. 页面只测 ViewModel / Facade 行为和关键用户路径，不把样式细节写成脆弱测试。

### 12.2 命令要求

常规代码变更：

```powershell
pnpm.cmd run verify
```

触及页面、云函数、构建、发布配置、路由、manifest：

```powershell
pnpm.cmd run verify:full
```

后端/API/OCR provider 变更：

```powershell
pnpm.cmd run verify:backend
pnpm.cmd run verify:api
```

具体命令以当时 `package.json` 为准。若命令不存在，必须先补命令或在交付日志中说明为什么不能运行。

## 13. 文档与交付要求

每个风险组完成后必须更新：

1. 对应风险组执行计划或阶段 PRD。
2. `docs/plans/YYYY-MM-DD-*-delivery-log.md`。
3. `docs/architecture/system-overview.md`，如模块结构变化。
4. `docs/architecture/module-boundaries.md`，如边界变化。
5. `docs/contracts/domain-contract.md`，如业务合同变化。
6. `docs/contracts/api-contract.md`，如 API 合同变化。
7. `docs/contracts/cloudbase-data-model.md`，如 CloudBase 集合、索引、权限变化。
8. `docs/testing/test-strategy.md`，如测试命令或策略变化。
9. `docs/quality/review-checklist.md`，如质量门禁变化。
10. `docs/operations/` 下对应 runbook，如发布、备份、恢复、配置、监控变化。

交付记录必须包含：

1. 完成内容。
2. 文件变更。
3. 未改动的业务边界。
4. 验证命令和结果。
5. CloudBase 或微信开发者工具人工证据，若该组需要。
6. 剩余 gap。
7. 下一轮建议。

## 14. 明确不做

本 PRD 不做：

1. 不执行 Phase 4 完整微信开发者工具人工验收。
2. 不新增支付。
3. 不新增物流。
4. 不新增退款。
5. 不新增优惠券。
6. 不新增真实购物袋。
7. 不新增客服消息系统。
8. 不做大规模 UI 重构。
9. 不替换 CloudBase 路线。
10. 不重写已验收的高端女装真实小程序页面迁移。
11. 不把 OCR 原型文档当作真实 OCR 实现。
12. 不绕过主 PRD 的最终上线门禁。

## 15. 推荐执行顺序

按以下顺序执行：

1. 风险组 A：生产配置与 Secret 门禁。
2. 风险组 B1：OCR Job 状态机。
3. 风险组 B2：OCR Provider 接口。
4. 风险组 B3：草稿质量与人工校正。
5. 风险组 B4：OCR UI 最小接入。
6. 风险组 C：订单运营补齐。
7. 风险组 D：图片链路复验与补缺。
8. 风险组 E：备份、恢复与回滚演练。
9. 风险组 F：合规与发布资料。
10. 风险组 G：发布流水线、远程仓库与监控告警。
11. 风险组 H：最终上线 Readiness Gate。

每完成一个风险组，都必须停下给用户验收，不得自动进入下一组。

## 16. 本 PRD 完成定义

本 PRD 完成后，只代表上线风险分组路线已经明确，不代表任何风险组已经实现。

完成定义：

1. 本文档已创建。
2. 已明确按上线风险分组推进，而不是按原 Phase 顺序直接推进。
3. 已明确每个风险组的允许范围、禁止范围、验收标准和执行束缚。
4. 已明确 Phase 4 完整人工验收不纳入本 PRD 执行范围，但仍保留为最终上线门禁外部状态。
5. 用户确认后，下一步从风险组 A 开始，另写执行计划并实施。
