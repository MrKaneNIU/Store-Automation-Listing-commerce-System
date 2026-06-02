# Package Scripts And Configs

## package.json

```json
{
  "name": "vx-close-system",
  "version": "0.0.0",
  "scripts": {
    "dev:mp-weixin": "uni -p mp-weixin",
    "test": "vitest run --config vitest.config.ts",
    "build:mp-weixin": "uni build -p mp-weixin",
    "build": "pnpm run build:mp-weixin",
    "type-check": "vue-tsc --noEmit",
    "typecheck": "pnpm run type-check",
    "backend:test": "vitest run --config backend/vitest.config.ts",
    "backend:build": "tsc -p backend/tsconfig.json",
    "backend:start": "node backend/dist/main.js",
    "backend:migrate": "pnpm run backend:build && node backend/dist/db/migrate.js apply",
    "backend:migrate:status": "pnpm run backend:build && node backend/dist/db/migrate.js status",
    "backend:restore:rehearsal": "pnpm run backend:build && node backend/dist/operations/staging-[REDACTED_ID].js",
    "cloudbase:api:smoke": "node scripts/smoke-cloudbase-api.mjs",
    "cloudbase:health:smoke": "node scripts/smoke-cloudbase-health.mjs",
    "cloudbase:prod-config:test": "node --test scripts/check-production-config.test.mjs",
    "cloudbase:prod-config:check": "node scripts/check-production-config.mjs",
    "verify:backend": "pnpm run backend:test && pnpm run backend:build",
    "verify:api": "pnpm run backend:test && pnpm run backend:build",
    "lint": "eslint \"src/**/*.{ts,vue}\" \"*.config.ts\"",
    "boundary-check": "node scripts/[REDACTED_ID].mjs",
    "smoke:mp-weixin": "node scripts/e2e-smoke.mjs",
    "e2e:smoke": "pnpm run build:mp-weixin && pnpm run smoke:mp-weixin",
    "coverage": "vitest run --config vitest.config.ts --coverage",
    "audit:prod": "pnpm audit --prod --audit-level moderate",
    "audit:all": "pnpm audit --audit-level low",
    "verify": "pnpm run lint && pnpm run boundary-check && pnpm run test && pnpm run coverage && pnpm run type-check && pnpm run verify:backend && pnpm run audit:prod && pnpm run audit:all",
    "verify:full": "pnpm run verify && pnpm run e2e:smoke"
  },
  "dependencies": {
    "@dcloudio/uni-app": "3.0.[REDACTED_ID]",
    "@dcloudio/[REDACTED_ID]": "3.0.[REDACTED_ID]",
    "@dcloudio/uni-mp-weixin": "3.0.[REDACTED_ID]",
    "@vant/weapp": "^1.11.7",
    "pg": "^8.20.0",
    "[REDACTED_ID]": "^1.14.0",
    "tencentcloud-sdk-nodejs": "^4.1.235",
    "vue": "^3.4.21",
    "vue-i18n": "^9.1.9"
  },
  "devDependencies": {
    "@dcloudio/types": "^3.4.8",
    "@dcloudio/[REDACTED_ID]": "3.0.[REDACTED_ID]",
    "@dcloudio/uni-cli-shared": "3.0.[REDACTED_ID]",
    "@dcloudio/[REDACTED_ID]": "3.0.[REDACTED_ID]",
    "@dcloudio/vite-plugin-uni": "3.0.[REDACTED_ID]",
    "@eslint/js": "^10.0.1",
    "@types/node": "25.6.0",
    "@types/pg": "^8.20.0",
    "@vitest/coverage-v8": "1.6.1",
    "@vue/runtime-core": "^3.4.21",
    "@vue/tsconfig": "^0.9.1",
    "eslint": "^10.3.0",
    "eslint-plugin-vue": "^10.9.1",
    "globals": "^17.6.0",
    "pg-mem": "^3.0.14",
    "typescript": "^5.0.0",
    "typescript-eslint": "^8.59.2",
    "vite": "^6.4.2",
    "vitest": "^1.6.1",
    "vue-tsc": "^2.2.12"
  },
  "pnpm": {
    "overrides": {
      "@intlify/core-base": "9.14.5",
      "@intlify/[REDACTED_ID]": "9.1.11",
      "@tootallnate/once": "^3.0.1",
      "cookie": "^0.7.0",
      "esbuild": "^0.25.0",
      "jpeg-js": "^0.4.4",
      "path-to-regexp": "0.1.13",
      "phin": "^3.7.1",
      "postcss": "^8.5.10",
      "qs": "6.15.2",
      "send": "^0.19.0",
      "serve-static": "^1.16.2",
      "uuid": "11.1.1",
      "ws": "^8.20.1",
      "vite": "^6.4.2"
    }
  }
}

```

## pnpm-lock.yaml summary

# pnpm lock summary

- lockfileVersion: '9.0'

## Root dependencies from package.json

- @dcloudio/uni-app: 3.0.0-4080420251103001
- @dcloudio/uni-components: 3.0.0-4080420251103001
- @dcloudio/uni-mp-weixin: 3.0.0-4080420251103001
- @vant/weapp: ^1.11.7
- pg: ^8.20.0
- tdesign-miniprogram: ^1.14.0
- tencentcloud-sdk-nodejs: ^4.1.235
- vue: ^3.4.21
- vue-i18n: ^9.1.9

## Root devDependencies from package.json

- @dcloudio/types: ^3.4.8
- @dcloudio/uni-automator: 3.0.0-4080420251103001
- @dcloudio/uni-cli-shared: 3.0.0-4080420251103001
- @dcloudio/uni-stacktracey: 3.0.0-4080420251103001
- @dcloudio/vite-plugin-uni: 3.0.0-4080420251103001
- @eslint/js: ^10.0.1
- @types/node: 25.6.0
- @types/pg: ^8.20.0
- @vitest/coverage-v8: 1.6.1
- @vue/runtime-core: ^3.4.21
- @vue/tsconfig: ^0.9.1
- eslint: ^10.3.0
- eslint-plugin-vue: ^10.9.1
- globals: ^17.6.0
- pg-mem: ^3.0.14
- typescript: ^5.0.0
- typescript-eslint: ^8.59.2
- vite: ^6.4.2
- vitest: ^1.6.1
- vue-tsc: ^2.2.12

## Overrides

- @intlify/core-base: 9.14.5
- @intlify/message-resolver: 9.1.11
- @tootallnate/once: ^3.0.1
- cookie: ^0.7.0
- esbuild: ^0.25.0
- jpeg-js: ^0.4.4
- path-to-regexp: 0.1.13
- phin: ^3.7.1
- postcss: ^8.5.10
- qs: 6.15.2
- send: ^0.19.0
- serve-static: ^1.16.2
- uuid: 11.1.1
- ws: ^8.20.1
- vite: ^6.4.2

## Config files

### tsconfig.json

```json
{
  "extends": "@vue/tsconfig/tsconfig.json",
  "compilerOptions": {
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "lib": ["esnext", "dom"],
    "types": ["@dcloudio/types"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}

```

### backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "src/**/*.test.ts"]
}

```

### vite.config.ts

```
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
});

```

### vitest.config.ts

```
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'cloudfunctions/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/main.ts', 'src/App.vue', 'src/pages/**', 'src/static/**'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
})

```

### eslint.config.mjs

```
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'unpackage/**', 'coverage/**', 'src/**/*.d.ts', '*.local', '*.log'],
  },
  {
    files: ['src/**/*.{ts,vue}', '*.config.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, ...pluginVue.configs['flat/essential']],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        uni: 'readonly',
        wx: 'readonly',
      },
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-[REDACTED_ID]': 'off',
      'vue/multi-[REDACTED_ID]-names': 'off',
    },
  },
)

```

### src/pages.json

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "VX Close",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/login/index",
      "style": {
        "navigationBarTitleText": "管理登录",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/owner/dashboard/index",
      "style": {
        "navigationBarTitleText": "管理工作台",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/owner/import-upload/index",
      "style": {
        "navigationBarTitleText": "截图识别"
      }
    },
    {
      "path": "pages/owner/draft-review/index",
      "style": {
        "navigationBarTitleText": "草稿确认"
      }
    },
    {
      "path": "pages/owner/products/index",
      "style": {
        "navigationBarTitleText": "商品管理",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/owner/orders/index",
      "style": {
        "navigationBarTitleText": "订单确认",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/owner/more/index",
      "style": {
        "navigationBarTitleText": "更多",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/owner/[REDACTED_ID]/index",
      "style": {
        "navigationBarTitleText": "无权限"
      }
    },
    {
      "path": "pages/owner/permissions/index",
      "style": {
        "navigationBarTitleText": "权限管理"
      }
    },
    {
      "path": "pages/owner/[REDACTED_ID]/index",
      "style": {
        "navigationBarTitleText": "首页设置"
      }
    },
    {
      "path": "pages/owner/[REDACTED_ID]/index",
      "style": {
        "navigationBarTitleText": "账号管理"
      }
    },
    {
      "path": "pages/staff/image-tasks/index",
      "style": {
        "navigationBarTitleText": "待补图"
      }
    },
    {
      "path": "pages/customer/product-list/index",
      "style": {
        "navigationBarTitleText": "商品列表",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/customer/favorites/index",
      "style": {
        "navigationBarTitleText": "我的收藏",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/customer/shopping-bag/index",
      "style": {
        "navigationBarTitleText": "购物袋",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/customer/mine/index",
      "style": {
        "navigationBarTitleText": "我的",
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/customer/product-detail/index",
      "style": {
        "navigationBarTitleText": "商品详情",
        "navigationStyle": "custom"
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "VX Close",
    "navigationBarBackgroundColor": "#FFFFFF",
    "backgroundColor": "#F6F7F9"
  }
}

```

### src/manifest.json

```json
{
  "name": "VX Close System",
  "appid": "wxa63c53796488d4d4",
  "description": "uni-app Vue 3 TypeScript WeChat Mini Program starter.",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  "mp-weixin": {
    "appid": "wxa63c53796488d4d4",
    "setting": {
      "urlCheck": true
    },
    "usingComponents": true
  },
  "uniStatistics": {
    "enable": false
  },
  "vueVersion": "3"
}

```

### project.config.json

- Not present in workspace.

### project.private.config.json

- Not present in workspace.

### cloudbaserc.json

```json
{
  "envId": "[REDACTED_CLOUDBASE_ENV]",
  "functionRoot": "./cloudfunctions",
  "functions": [
    {
      "name": "mallHealth",
      "dir": "./cloudfunctions/mallHealth",
      "runtime": "Nodejs18.15"
    },
    {
      "name": "mallApi",
      "dir": "./cloudfunctions/mallApi",
      "runtime": "Nodejs18.15"
    }
  ]
}

```

## GitHub workflows

### .github/workflows/ci.yml

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  verify:
    runs-on: windows-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --[REDACTED_ID]

      - name: Type check
        run: pnpm run type-check

      - name: Lint
        run: pnpm run lint

      - name: Boundary check
        run: pnpm run boundary-check

      - name: Test
        run: pnpm test

      - name: Backend verify
        run: pnpm run verify:backend

      - name: Production dependency audit
        run: pnpm audit --prod --audit-level moderate

      - name: Full dependency audit
        run: pnpm audit --audit-level low

      - name: Build WeChat mini program
        run: pnpm run build:mp-weixin

      - name: E2E smoke
        run: pnpm run smoke:mp-weixin

```

## Boundary check script

### scripts/check-boundaries.mjs

```js
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const srcRoot = path.join(root, 'src')
const sourceExtensions = new Set(['.ts', '.vue'])

const toPosix = (value) => value.split(path.sep).join('/')

const listSourceFiles = (directory) => {
  const entries = readdirSync(directory)
  return entries.flatMap((entry) => {
    const absolutePath = path.join(directory, entry)
    const stat = statSync(absolutePath)
    if (stat.isDirectory()) {
      return listSourceFiles(absolutePath)
    }
    return sourceExtensions.has(path.extname(entry)) ? [absolutePath] : []
  })
}

const readImports = (filePath) => {
  const source = readFileSync(filePath, 'utf8')
  const imports = []
  const staticImportPattern = /import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g
  const dynamicImportPattern = /import\(\s*['"]([^'"]+)['"]\s*\)/g

  for (const pattern of [staticImportPattern, dynamicImportPattern]) {
    for (const match of source.matchAll(pattern)) {
      imports.push(match[1])
    }
  }

  return imports
}

const resolveInternalImport = (filePath, specifier) => {
  if (specifier.startsWith('@/')) {
    return `src/${specifier.slice(2)}`
  }
  if (!specifier.startsWith('.')) {
    return null
  }

  const importerDirectory = path.dirname(filePath)
  const resolved = path.resolve(importerDirectory, specifier)
  const relative = toPosix(path.relative(root, resolved))
  return relative.startsWith('src/') ? relative : null
}

const isTestFile = (relativePath) => relativePath.endsWith('.test.ts')
const isUnder = (relativePath, directory) => relativePath.startsWith(`${directory}/`)

const violations = []
const addViolation = (file, specifier, message) => {
  violations.push(`${file} imports "${specifier}": ${message}`)
}

for (const filePath of listSourceFiles(srcRoot)) {
  const relativeFile = toPosix(path.relative(root, filePath))
  const imports = readImports(filePath)

  for (const specifier of imports) {
    const resolved = resolveInternalImport(filePath, specifier)
    if (!resolved) {
      continue
    }

    if (isUnder(relativeFile, 'src/domain') && !isTestFile(relativeFile)) {
      if (isUnder(resolved, 'src/features') || isUnder(resolved, 'src/services') || isUnder(resolved, 'src/pages')) {
        addViolation(relativeFile, specifier, 'domain code must not depend on features, services, or pages')
      }
    }

    if (isUnder(relativeFile, 'src/services') && !isTestFile(relativeFile)) {
      if (isUnder(resolved, 'src/features') || isUnder(resolved, 'src/pages')) {
        addViolation(relativeFile, specifier, 'services must not depend on features or pages')
      }
    }

    if (isUnder(relativeFile, 'src/features') && !isTestFile(relativeFile)) {
      if (isUnder(resolved, 'src/pages')) {
        addViolation(relativeFile, specifier, 'features must not depend on pages')
      }
    }

    if (isUnder(relativeFile, 'src/pages')) {
      if (resolved.includes('/repositories/mock-db')) {
        addViolation(relativeFile, specifier, 'pages must not import mockDb directly')
      }
      if (resolved.includes('/services/ocr/mock-[REDACTED_ID]') || resolved.includes('/services/storage/mock-upload-service')) {
        addViolation(relativeFile, specifier, 'pages must not import mock OCR or mock upload adapters directly')
      }
      if (resolved.includes('/services/repositories/mall-repository')) {
        addViolation(relativeFile, specifier, 'pages must go through feature query/use-case functions instead of repositories')
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Boundary violations:')
  violations.forEach((violation) => console.error(`- ${violation}`))
  process.exit(1)
}

console.log('Boundary check passed.')

```