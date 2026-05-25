# PRD 文档目录

每次进入新的开发任务前，将本轮指定的 PRD 放在这里，并在任务说明中明确文件名。

建议命名：

```text
YYYY-MM-DD-功能名称-prd.md
```

当前 MVP 主线：

- 微信小程序服装商城
- 云 e 宝截图批量上传
- Mock OCR 识别商品草稿
- 老板确认后生成 SPU/SKU
- 店员补图
- 老板上架
- 客户下单
- 商家确认订单

当前任务 PRD：

- `2026-05-08-customer-wechat-auth-order-prd.md`：客户侧微信快捷登录与手机号授权下单，已按 4 个模块完成并通过回归验证。
- `2026-05-08-ui-boundary-engineering-prd.md`：UI 边界工程化，用于保护后续 UI 重构不误伤业务主链。

贯穿项目的主 PRD：

- `2026-05-08-enterprise-launch-master-prd.md`：企业级上线、持续迭代、真实后端、真实存储、真实微信能力、真实 OCR/AI、UI 重构、发布验收和回滚治理总纲。后续阶段任务必须以它为总路线。
- `2026-05-19-enterprise-launch-risk-grouped-prd.md`：在主 PRD 基础上，将剩余上线缺口按风险分组重排为生产配置、真实 OCR、订单运营、图片复验、备份回滚、合规发布、监控和最终 readiness gate 的执行总控文档。

商品管理增强：

- `2026-05-25-product-management-operations-prd.md`：商品管理运营能力补齐，覆盖商品简介编辑、SKU/库存编辑工作台、上架前校验和客户详情展示规则。

Phase 2 路线更新：

- `2026-05-09-phase-2-real-backend-persistence-prd.md`：Phase 2 后端与持久化阶段 PRD。2026-05-09 起已更新为 CloudBase 官方路线；文档中保留 PostgreSQL 工程基线的历史说明，但后续默认不再以 `DATABASE_URL` / SQL migration 作为实施方向。
- `../plans/2026-05-09-cloudbase-route-decision.md`：CloudBase 路线决策记录。后续 Phase 2 实施应优先读取此决策，确认 CloudBase 环境、云函数、云数据库集合和云存储边界。

最新交付记录：

- `../plans/2026-05-25-product-management-operations-delivery-log.md`
- `../plans/2026-05-19-risk-group-a-production-config-gate-log.md`
- `../plans/2026-05-19-risk-group-b-ocr-job-main-chain-log.md`
- `../plans/2026-05-08-customer-wechat-auth-order-delivery-log.md`
- `../plans/2026-05-08-harness-hardening-delivery-log.md`
- `../plans/2026-05-08-ui-boundary-engineering-delivery-log.md`
- `../plans/2026-05-09-cloudbase-route-decision.md`
