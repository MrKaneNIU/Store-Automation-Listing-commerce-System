#!/usr/bin/env node

import {
  checkRequiredCollections,
  isProductionLikeEnv,
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

if (isProductionLikeEnv(envId) && process.env.CLOUDBASE_SCHEMA_ALLOW_PRODUCTION !== '1') {
  console.error(`Refusing to apply schema to production-like environment: ${envId}`)
  process.exit(1)
}

console.log(`[cloudbase:schema:apply:staging] envId=${envId}`)

const results = await checkRequiredCollections(envId, manifest)
const missing = results.filter((result) => result.status === 'missing')
const errors = results.filter((result) => result.status === 'error')

if (errors.length > 0) {
  console.error(JSON.stringify({
    ok: false,
    envId,
    probeErrors: errors.map((result) => ({ name: result.name, exitCode: result.exitCode })),
  }, null, 2))
  process.exit(1)
}

if (missing.length === 0) {
  console.log(JSON.stringify({
    ok: true,
    envId,
    changed: false,
    message: 'All required CloudBase collections already exist.',
  }, null, 2))
  process.exit(0)
}

console.error(JSON.stringify({
  ok: false,
  envId,
  changed: false,
  missingCollections: missing.map((result) => result.name),
  manualChecklist: missing.map((result) => ({
    action: 'createCollection',
    collectionName: result.name,
    indexes: manifest.requiredCollections.find((collection) => collection.name === result.name)?.indexes || [],
  })),
  reason: 'CloudBase CLI exposes NoSQL query/write operations but no safe empty-collection create command. Use CloudBase console or MCP writeNoSqlDatabaseStructure, then rerun schema:check.',
}, null, 2))
process.exit(1)
