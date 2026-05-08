# Mall MVP Framework Implementation Plan

**Goal:** Build a product-grade project boundary for the WeChat mini-program mall MVP, with a mock OCR closed loop ready for future real OCR replacement.

**Architecture:** Keep pages thin, put business rules in domain modules, and route all mock/real integrations through services and repositories. The first version stores data in an in-memory mock database so the full business flow can be verified before backend/OCR integration.

**Tech Stack:** uni-app, Vue 3, TypeScript, TDesign MiniProgram, Vant Weapp, Vitest.

## Tasks

1. Create PRD and plan directories.
2. Add Vitest for core business-rule tests.
3. Define domain models and status constants.
4. Implement draft validation, SPU/SKU creation, publishing, and order rules.
5. Add mock OCR, upload, and repository services behind replaceable interfaces.
6. Create owner, staff, and customer page routes for the full MVP loop.
7. Update docs and verify type-check, tests, and mp-weixin build.
