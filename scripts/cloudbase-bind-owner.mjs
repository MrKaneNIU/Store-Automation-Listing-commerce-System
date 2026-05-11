#!/usr/bin/env node

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const args = new Map()
for (let index = 2; index < process.argv.length; index += 1) {
  const current = process.argv[index]
  if (!current.startsWith('--')) continue
  const key = current.slice(2)
  const next = process.argv[index + 1]
  if (!next || next.startsWith('--')) {
    args.set(key, '1')
  } else {
    args.set(key, next)
    index += 1
  }
}

const readArg = (name) => args.get(name) || process.env[`CLOUDBASE_BIND_OWNER_${name.toUpperCase()}`]

const envId = readArg('envId') || process.env.CLOUDBASE_ENV_ID || process.env.TCB_ENV
const ownerOpenid = readArg('openid')
const operator = readArg('operator') || 'local-script'
const reason = readArg('reason') || 'bootstrap owner role'
const dryRun = args.has('dry-run')

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

if (!envId) fail('Missing --envId or CLOUDBASE_ENV_ID.')
if (!ownerOpenid) fail('Missing --openid for the owner to bind.')

let cloudbase
try {
  cloudbase = require('@cloudbase/node-sdk')
} catch (_error) {
  fail('Missing @cloudbase/node-sdk. Run this script in an environment with CloudBase Node SDK installed.')
}

const app = cloudbase.init({ env: envId })
const db = app.database()

const now = new Date().toISOString()
const roleId = `role-owner-${ownerOpenid}`
const auditId = `audit-bind-owner-${ownerOpenid}-${Date.now()}`

const collection = (name) => db.collection(name)
const resultData = (result) => result.data || []

const existing = resultData(await collection('role_assignments').where({
  openid: ownerOpenid,
  role: 'owner',
}).get()).at(0)

if (dryRun) {
  console.log(JSON.stringify({
    dryRun: true,
    envId,
    openid: ownerOpenid,
    role: 'owner',
    status: 'active',
    wouldUpdateExisting: Boolean(existing),
    roleAssignmentId: existing?._id || roleId,
    auditAction: 'bind_owner',
    operator,
    reason,
  }, null, 2))
  process.exit(0)
}

if (existing) {
  await collection('role_assignments').doc(existing._id).update({
    status: 'active',
    updated_at: now,
    updated_by: operator,
    reason,
  })
} else {
  await collection('role_assignments').add({
    _id: roleId,
    openid: ownerOpenid,
    role: 'owner',
    status: 'active',
    created_at: now,
    updated_at: now,
    created_by: operator,
    updated_by: operator,
    reason,
  })
}

await collection('operation_audit_logs').add({
  _id: auditId,
  action: 'bind_owner',
  target_openid: ownerOpenid,
  target_role: 'owner',
  operator,
  reason,
  created_at: now,
})

console.log(JSON.stringify({
  ok: true,
  envId,
  openid: ownerOpenid,
  role: 'owner',
  status: 'active',
  roleAssignmentId: existing?._id || roleId,
  auditId,
}, null, 2))
