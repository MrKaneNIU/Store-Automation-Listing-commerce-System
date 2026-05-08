import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const buildRoot = path.join(root, 'dist', 'build', 'mp-weixin')

const requiredRootFiles = ['app.js', 'app.json', 'app.wxss', 'project.config.json']
const requiredCompiledModules = [
  'domain/catalog/rules.js',
  'domain/draft/rules.js',
  'domain/order/rules.js',
  'features/customer-order/customer-order.js',
  'features/draft-review/draft-review.js',
  'features/mall-workflow/mall-workflow.js',
  'services/auth/mock-wechat-auth-service.js',
  'services/ocr/mock-ocr-provider.js',
  'services/repositories/mall-repository.js',
  'services/storage/mock-upload-service.js',
]

const failures = []

const assertFile = (relativePath) => {
  const absolutePath = path.join(buildRoot, ...relativePath.split('/'))
  if (!existsSync(absolutePath)) {
    failures.push(`Missing build artifact: dist/build/mp-weixin/${relativePath}`)
  }
}

const readJson = (filePath) => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (error) {
    failures.push(`Invalid JSON: ${path.relative(root, filePath)} (${error.message})`)
    return null
  }
}

if (!existsSync(buildRoot)) {
  failures.push('Missing build output: dist/build/mp-weixin. Run pnpm.cmd run build:mp-weixin first.')
} else {
  requiredRootFiles.forEach(assertFile)
  requiredCompiledModules.forEach(assertFile)

  const sourcePagesJson = readJson(path.join(root, 'src', 'pages.json'))
  const builtAppJson = readJson(path.join(buildRoot, 'app.json'))
  const builtProjectConfig = readJson(path.join(buildRoot, 'project.config.json'))

  if (sourcePagesJson && builtAppJson) {
    const sourcePages = sourcePagesJson.pages.map((page) => page.path)
    const builtPages = builtAppJson.pages ?? []

    if (sourcePages.length === 0) {
      failures.push('src/pages.json has no pages.')
    }

    for (const pagePath of sourcePages) {
      if (!builtPages.includes(pagePath)) {
        failures.push(`Built app.json is missing page route: ${pagePath}`)
      }

      for (const extension of ['js', 'json', 'wxml', 'wxss']) {
        assertFile(`${pagePath}.${extension}`)
      }
    }
  }

  if (
    builtProjectConfig &&
    builtProjectConfig.miniprogramRoot !== undefined &&
    builtProjectConfig.miniprogramRoot !== './'
  ) {
    failures.push(`Unexpected project.config.json miniprogramRoot: ${builtProjectConfig.miniprogramRoot}`)
  }
}

if (failures.length > 0) {
  console.error('E2E smoke failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('E2E smoke passed: mp-weixin build artifacts and page routes are present.')
