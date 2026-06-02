#!/usr/bin/env node

import {
  isProductionLikeEnv,
  parseArgs,
  readSchemaManifest,
  resolveEnvId,
} from './cloudbase-schema-utils.mjs'
import { runCloudBaseImagesAudit } from './cloudbase-images-audit.mjs'

const args = parseArgs()
const manifest = await readSchemaManifest()
const envId = resolveEnvId(args, manifest)

if (!envId) {
  console.error('Missing CloudBase envId. Pass --envId or set CLOUDBASE_ENV_ID.')
  process.exit(1)
}

if (isProductionLikeEnv(envId)) {
  console.error(`Refusing to repair production-like CloudBase env: ${envId}`)
  process.exit(1)
}

const audit = await runCloudBaseImagesAudit({ envId })
const output = {
  ok: audit.blockingIssues.length === 0 && audit.unrecoverableRecords.length === 0,
  envId,
  mode: 'staging-readiness',
  applied: false,
  message: audit.repairCandidates.length === 0
    ? 'No staging image repair candidates were found.'
    : 'Repair candidates found. Apply with a dedicated reviewed CloudBase data migration before production use.',
  audit,
}

console.log(JSON.stringify(output, null, 2))

if (!output.ok) {
  process.exit(1)
}
