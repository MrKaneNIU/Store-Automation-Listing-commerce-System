import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const defaultBuildRoot = path.join(root, 'dist', 'build', 'mp-weixin')

const unsupportedRequirePattern = /require\(\s*["'](?:node:)?(url|fs|path|crypto|stream)["']\s*\)/g
const staticRequirePattern = /require\(\s*["']([^"']+)["']\s*\)/g
const forbiddenLiteralPatterns = [
  { pattern: /pathToFileURL/g, label: 'pathToFileURL' },
  { pattern: /services\/performance\/url\.js/g, label: 'services/performance/url.js' },
]

const toPosix = (value) => value.split(path.sep).join('/')

const collectJsFiles = (directory) => {
  const files = []
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const absolute = path.join(current, entry)
      const stats = statSync(absolute)
      if (stats.isDirectory()) {
        walk(absolute)
      } else if (stats.isFile() && absolute.endsWith('.js')) {
        files.push(absolute)
      }
    }
  }

  walk(directory)
  return files
}

const hasResolvedLocalTarget = (fromFile, request) => {
  if (!request.startsWith('.') && !request.startsWith('/')) return true

  const basePath = request.startsWith('/')
    ? path.join(defaultBuildRoot, request.slice(1))
    : path.resolve(path.dirname(fromFile), request)

  const candidates = [
    basePath,
    `${basePath}.js`,
    path.join(basePath, 'index.js'),
  ]

  return candidates.some((candidate) => existsSync(candidate) && statSync(candidate).isFile())
}

const findLineNumber = (content, index) => content.slice(0, index).split(/\r?\n/).length

export const auditMpRuntime = (buildRoot = defaultBuildRoot) => {
  const failures = []

  if (!existsSync(buildRoot)) {
    return [`Missing build output: ${toPosix(path.relative(root, buildRoot)) || buildRoot}. Run pnpm.cmd run build:mp-weixin first.`]
  }

  for (const filePath of collectJsFiles(buildRoot)) {
    const relativePath = toPosix(path.relative(buildRoot, filePath))
    const content = readFileSync(filePath, 'utf8')

    for (const { pattern, label } of forbiddenLiteralPatterns) {
      pattern.lastIndex = 0
      for (const match of content.matchAll(pattern)) {
        failures.push(`${relativePath}:${findLineNumber(content, match.index ?? 0)} contains forbidden runtime literal ${label}`)
      }
    }

    unsupportedRequirePattern.lastIndex = 0
    for (const match of content.matchAll(unsupportedRequirePattern)) {
      failures.push(`${relativePath}:${findLineNumber(content, match.index ?? 0)} requires unsupported Node built-in module "${match[1]}"`)
    }

    staticRequirePattern.lastIndex = 0
    for (const match of content.matchAll(staticRequirePattern)) {
      const request = match[1]
      if (!hasResolvedLocalTarget(filePath, request)) {
        failures.push(`${relativePath}:${findLineNumber(content, match.index ?? 0)} requires missing local module "${request}"`)
      }
    }
  }

  return failures
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  const failures = auditMpRuntime(process.argv[2] ? path.resolve(process.argv[2]) : defaultBuildRoot)

  if (failures.length > 0) {
    console.error('MP runtime audit failed:')
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exit(1)
  }

  console.log('MP runtime audit passed: no unsupported Node built-ins or missing local require targets found.')
}
