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
      if (resolved.includes('/services/ocr/mock-ocr-provider') || resolved.includes('/services/storage/mock-upload-service')) {
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
