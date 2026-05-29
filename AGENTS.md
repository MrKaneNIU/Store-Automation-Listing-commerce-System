# Codex 项目工作流

本项目采用 PRD 驱动的多角色交付流程。

当用户要求“根据 PRD 实现功能”、“执行 PRD”、“ship PRD”、“处理 PRD.md”时，必须按以下顺序执行：

1. Planner
2. Implementer
3. Reviewer
4. Debugger，如测试失败或 Reviewer 不通过
5. Reporter

## 全局规则

- 不要扩大 PRD 范围。
- 不要做无关重构。
- 不要修改 PRD 未要求的功能。
- 所有代码改动必须能解释为服务于 PRD。
- 优先补测试，再实现代码。
- 如果测试失败，必须先定位根因，再做最小修复。
- Reviewer 不允许修改代码。
- Reporter 不允许修改代码。
- Debugger 最多修复两轮，超过两轮必须停止并汇报原因。

## 固定输出文件

请尽量把阶段性结果写入：

- `.ai/PLAN.md`
- `.ai/IMPLEMENTATION.md`
- `.ai/REVIEW.md`
- `.ai/DEBUG.md`
- `.ai/FINAL_REPORT.md`

## 验收标准

最终必须输出：

1. 是否完成 PRD
2. 修改了哪些文件
3. 测试是否通过
4. Reviewer 是否通过
5. 剩余风险
6. 是否建议合并

# Codex 项目说明

本项目是一个基于 uni-app、Vue 3 和 TypeScript 的微信小程序 MVP。当前优先级是提升工程成熟度：保护已经闭环的业务流程，保持改动小而可控，并让后续迭代可以被验证。

## Codex 工作原则

- 基于仓库事实工作，不凭空假设架构。
- 每个任务都必须限定在用户已批准的目标内。
- 优先采用小步、分阶段的改动，避免大范围重写。
- 除非任务明确要求改变现有 MVP 业务闭环，否则必须保留它。
- 不做顺手清理、机会性重构或无关样式调整。
- 除非任务确实需要，否则不要引入新依赖；如果必须引入，编辑前说明原因。
- 将 `docs/prd/` 和 `docs/plans/` 视为产品历史记录。除非用户要求，不要重写已接受的 PRD 或交付日志。

## 编辑前必做

每个实现任务开始前，必须先给出 Repository Impact Map 和 Execution Plan。

Repository Impact Map 必须列出：

- 预计会修改的文件或目录。
- 明确不在范围内的文件或目录。
- 必须保持不变的业务契约。
- 将要运行的验证命令。

Execution Plan 必须列出：

- 准备执行的小步骤。
- 每一步的验收标准。
- 仍不确定的假设。

## 边界

- 如果任务只涉及文档、测试工具、CI 或规划，不要修改业务逻辑。
- 如果任务只涉及后端、服务、文档、测试或工具链，不要修改 UI。
- 未经明确批准，不要更改数据模型或 API 契约。
- 不要删除测试。
- 不要削弱断言。
- 除非用户明确批准新的预期行为，否则不要修改已批准的 fixture。
- 页面不要绕过现有工作流方法；页面层不应新增直接仓储写入。
- 不要在现有 service/repository 层之外添加隐藏的全局状态。

## 当前分层规则

- `src/domain/` 负责实体类型、纯规则、状态检查和业务不变量。
- `src/features/` 负责跨 domain 和 services 的用例编排。
- `src/services/` 负责外部 IO 适配器、mock provider、认证、上传和仓储实现。
- `src/pages/` 负责页面渲染、页面局部状态、用户交互和 `uni` API。
- `docs/` 负责 PRD、交付日志、架构、测试策略和质量流程。

## 依赖规则

- `domain` 不得导入 `features`、`services`、`pages` 或 `uni` API。
- `features` 可以导入 `domain` 和 service ports/adapters。
- `pages` 可以调用 feature use-cases 和页面安全的查询，但不应新增直接仓储写入。
- mock 实现应尽量保持在 service interface 后面。
- 新包必须有清晰原因，不得随意添加。

## 完成前必须检查

运行与任务匹配的最强现有检查：

```powershell
pnpm.cmd run verify
```

`verify` 会运行 lint、边界检查、测试、覆盖率、类型检查和依赖审计。当代码或构建配置改动可能影响小程序构建时，还要运行：

```powershell
pnpm.cmd run verify:full
```

如果命令不存在或无法运行，必须明确说明。绝不能编造通过结果。

## 最终汇报要求

每个完成任务的汇报必须包含：

- 修改了哪些文件，以及修改原因。
- 哪些业务代码被有意保持不变。
- 运行了哪些检查及结果。
- 剩余的测试工具或产品缺口。
- 有用时，给出建议的下一项任务。
