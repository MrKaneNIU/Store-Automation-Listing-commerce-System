import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)
const repoRoot = process.cwd()
const cloudbaserc = JSON.parse(readFileSync(path.join(repoRoot, 'cloudbaserc.json'), 'utf8'))
const envId = process.env.CLOUDBASE_ENV_ID || cloudbaserc.envId

const { SUPPORTED_ACTIONS: localActions } = require('../cloudfunctions/mallApi/mall-api-core.js')

const productManagementActions = [
  'supplementProductImages',
  'publishProduct',
  'updateProductDescription',
  'updateSku',
  'restockSkus',
  'clearSkuStock',
  'unpublishProduct',
  'deleteProduct',
]

const readRemoteActions = () => {
  const args = [
    '--yes',
    '--package',
    '@cloudbase/cli',
    'tcb',
    '-e',
    envId,
    'fn',
    'invoke',
    'mallApi',
    '-d',
    '@cloudfunctions/mallApi/invoke-list-contracts.json',
    '--json',
  ]
  const output = process.platform === 'win32'
    ? execFileSync('cmd.exe', ['/d', '/s', '/c', `npx.cmd ${args.join(' ')}`], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    : execFileSync('npx', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })

  const envelope = JSON.parse(output)
  const retMsg = envelope?.data?.RetMsg
  if (typeof retMsg !== 'string') {
    throw new Error('mallApi invoke did not return a RetMsg string')
  }

  const result = JSON.parse(retMsg)
  if (!result.success || !Array.isArray(result.data?.actions)) {
    throw new Error(`mallApi listContracts failed: ${retMsg}`)
  }

  return result.data.actions
}

const remoteActions = readRemoteActions()
const missingRemoteProductActions = productManagementActions.filter((action) => !remoteActions.includes(action))
const missingRemoteLocalActions = localActions.filter((action) => !remoteActions.includes(action))

const report = {
  envId,
  localActionCount: localActions.length,
  remoteActionCount: remoteActions.length,
  productManagementActions,
  missingRemoteProductActions,
  missingRemoteLocalActions,
}

console.log(JSON.stringify(report, null, 2))

if (missingRemoteProductActions.length > 0) {
  console.error(`Product management contract repro failed: remote mallApi is missing ${missingRemoteProductActions.join(', ')}`)
  process.exit(1)
}

console.log('Product management contract repro passed: remote mallApi exposes all required product-management actions.')
