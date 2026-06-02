#!/usr/bin/env node

import {
  checkRequiredCollections,
  parseArgs,
  readSchemaManifest,
  resolveEnvId,
} from './cloudbase-schema-utils.mjs'

const manifest = await readSchemaManifest()
const args = parseArgs()
const envId = resolveEnvId(args, manifest)

if (!envId) {
  console.error('Missing CloudBase envId. Pass --envId or set CLOUDBASE_ENV_ID.')
  process.exit(1)
}

console.log(`[cloudbase:schema:check] envId=${envId}`)

const results = await checkRequiredCollections(envId, manifest)
const missing = results.filter((result) => result.status === 'missing')
const errors = results.filter((result) => result.status === 'error')

for (const result of results) {
  console.log(`- ${result.name}: ${result.status}`)
}

console.warn('[cloudbase:schema:check] index existence is a best-effort warning; verify indexes in CloudBase console/MCP.')

if (missing.length > 0 || errors.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    envId,
    missingCollections: missing.map((result) => result.name),
    probeErrors: errors.map((result) => ({ name: result.name, exitCode: result.exitCode })),
    fix: 'Run pnpm.cmd run cloudbase:schema:apply:staging for dev/staging, or create the listed collections manually before rerunning.',
  }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  envId,
  requiredCollections: results.length,
  collectionNames: results.map((result) => result.name),
}, null, 2))
