import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REQUIRED_MALL_API_ENV = [
  'WECHAT_APPID',
  'WECHAT_APPSECRET',
  'OCR_PROVIDER',
  'OCR_PROVIDER_ENDPOINT',
  'OCR_TENCENT_SECRET_ID',
  'OCR_TENCENT_SECRET_KEY',
]

const REQUIRED_DOMAIN_GROUPS = ['request', 'upload', 'download']

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function isPresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function hasVariable(environmentVariables, variableName) {
  if (Array.isArray(environmentVariables)) {
    return environmentVariables.some((name) => name === variableName)
  }

  if (environmentVariables && typeof environmentVariables === 'object') {
    return isPresent(environmentVariables[variableName])
  }

  return false
}

function addCheck(report, check) {
  report.checks.push(check)
  if (check.status === 'blocker') {
    const { status, ...blocker } = check
    report.blockers.push(blocker)
  }
}

export function evaluateProductionConfig(snapshot) {
  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    targetEnvId: snapshot?.targetEnvId ?? null,
    checks: [],
    blockers: [],
  }

  const targetEnvId = snapshot?.targetEnvId
  const cloudbasercEnvId = snapshot?.cloudbasercEnvId
  const mallApi = snapshot?.functions?.find((item) => item?.name === 'mallApi')

  if (!isPresent(targetEnvId)) {
    addCheck(report, {
      status: 'blocker',
      code: 'MISSING_TARGET_ENV',
      message: 'targetEnvId is required in the production config snapshot.',
    })
  }

  if (!isPresent(cloudbasercEnvId)) {
    addCheck(report, {
      status: 'blocker',
      code: 'MISSING_CLOUDBASERC_ENV',
      message: 'cloudbasercEnvId is required in the production config snapshot.',
    })
  } else if (isPresent(targetEnvId) && cloudbasercEnvId !== targetEnvId) {
    addCheck(report, {
      status: 'blocker',
      code: 'CLOUDBASERC_ENV_MISMATCH',
      message: `cloudbaserc.json targets ${cloudbasercEnvId} but the production gate targets ${targetEnvId}.`,
      expected: targetEnvId,
      actual: cloudbasercEnvId,
    })
  } else {
    addCheck(report, {
      status: 'pass',
      code: 'CLOUDBASERC_ENV_MATCH',
      message: 'cloudbaserc.json envId matches the production gate target.',
    })
  }

  if (!mallApi) {
    addCheck(report, {
      status: 'blocker',
      code: 'MISSING_FUNCTION',
      message: 'mallApi function detail is required in the production config snapshot.',
      functionName: 'mallApi',
    })
  } else {
    const functionEnvId = mallApi.envId
    if (!isPresent(functionEnvId)) {
      addCheck(report, {
        status: 'blocker',
        code: 'MISSING_FUNCTION_ENV_ID',
        message: 'mallApi function envId is missing from the production config snapshot.',
        functionName: 'mallApi',
      })
    } else if (isPresent(targetEnvId) && functionEnvId !== targetEnvId) {
      addCheck(report, {
        status: 'blocker',
        code: 'FUNCTION_ENV_MISMATCH',
        message: `mallApi is configured for ${functionEnvId} but target env is ${targetEnvId}.`,
        expected: targetEnvId,
        actual: functionEnvId,
        functionName: 'mallApi',
      })
    } else {
      addCheck(report, {
        status: 'pass',
        code: 'FUNCTION_ENV_MATCH',
        message: 'mallApi function envId matches the production gate target.',
        functionName: 'mallApi',
      })
    }

    for (const variable of REQUIRED_MALL_API_ENV) {
      if (!hasVariable(mallApi.environmentVariables, variable)) {
        addCheck(report, {
          status: 'blocker',
          code: 'MISSING_FUNCTION_ENV',
        message: `mallApi is missing required production variable ${variable}.`,
        functionName: 'mallApi',
        variable,
      })
      } else {
        addCheck(report, {
          status: 'pass',
          code: 'FUNCTION_ENV_PRESENT',
          message: `mallApi has required production variable ${variable}.`,
          functionName: 'mallApi',
          variable,
        })
      }
    }
  }

  if (snapshot?.manifestAppId && mallApi?.environmentVariables) {
    const appIdMatches = Array.isArray(mallApi.environmentVariables)
      ? hasVariable(mallApi.environmentVariables, 'WECHAT_APPID')
      : mallApi.environmentVariables.WECHAT_APPID === snapshot.manifestAppId

    if (!appIdMatches) {
      addCheck(report, {
        status: 'blocker',
        code: 'WECHAT_APPID_MISMATCH',
        message: 'WECHAT_APPID must match the manifest mp-weixin appid.',
        expected: snapshot.manifestAppId,
        actual: Array.isArray(mallApi.environmentVariables) ? '<value-not-exported>' : '<redacted>',
        functionName: 'mallApi',
        variable: 'WECHAT_APPID',
      })
    }
  }

  if (snapshot?.manifestUrlCheck !== true) {
    addCheck(report, {
      status: 'blocker',
      code: 'URL_CHECK_DISABLED',
      message: 'manifest mp-weixin setting.urlCheck must be true for production readiness.',
    })
  } else {
    addCheck(report, {
      status: 'pass',
      code: 'URL_CHECK_ENABLED',
      message: 'manifest mp-weixin setting.urlCheck is enabled.',
    })
  }

  for (const group of REQUIRED_DOMAIN_GROUPS) {
    const domains = snapshot?.domains?.[group]
    if (!Array.isArray(domains) || domains.length === 0) {
      addCheck(report, {
        status: 'blocker',
        code: 'MISSING_DOMAIN_GROUP',
        message: `${group} legal domain list is empty or missing.`,
        domainGroup: group,
      })
    } else {
      addCheck(report, {
        status: 'pass',
        code: 'DOMAIN_GROUP_PRESENT',
        message: `${group} legal domain list is present.`,
        domainGroup: group,
        count: domains.length,
      })
    }
  }

  if (snapshot?.storage?.bucketReady !== true) {
    addCheck(report, {
      status: 'blocker',
      code: 'STORAGE_NOT_READY',
      message: 'CloudBase storage bucket readiness is not verified.',
    })
  } else {
    addCheck(report, {
      status: 'pass',
      code: 'STORAGE_READY',
      message: 'CloudBase storage bucket readiness is verified.',
    })
  }

  if (snapshot?.storage?.httpsTlsVerified !== true) {
    addCheck(report, {
      status: 'blocker',
      code: 'STORAGE_TLS_NOT_VERIFIED',
      message: 'CloudBase storage HTTPS/TLS access is not verified.',
    })
  } else {
    addCheck(report, {
      status: 'pass',
      code: 'STORAGE_TLS_VERIFIED',
      message: 'CloudBase storage HTTPS/TLS access is verified.',
    })
  }

  report.ok = report.blockers.length === 0
  return report
}

export function renderJsonReport(report) {
  return `${JSON.stringify(report, null, 2)}\n`
}

export function renderHumanReport(report) {
  const lines = [
    `Production config gate: ${report.ok ? 'PASS' : 'FAIL'}`,
    `Target EnvId: ${report.targetEnvId ?? '<missing>'}`,
    `Blockers: ${report.blockers.length}`,
    '',
  ]

  for (const check of report.checks) {
    const prefix = check.status === 'pass' ? '[PASS]' : '[BLOCKER]'
    lines.push(`${prefix} ${check.code}: ${check.message}`)
  }

  return `${lines.join('\n')}\n`
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function buildLocalSnapshot(snapshotPath) {
  const snapshot = readJson(snapshotPath)
  const cloudbaserc = readJson(path.join(repoRoot, 'cloudbaserc.json'))
  const manifest = readJson(path.join(repoRoot, 'src', 'manifest.json'))

  return {
    ...snapshot,
    cloudbasercEnvId: snapshot.cloudbasercEnvId ?? cloudbaserc.envId,
    manifestAppId: snapshot.manifestAppId ?? manifest?.['mp-weixin']?.appid ?? manifest?.appid,
    manifestUrlCheck: snapshot.manifestUrlCheck ?? manifest?.['mp-weixin']?.setting?.urlCheck,
  }
}

function parseArgs(argv) {
  const args = {
    json: false,
    snapshotPath: null,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--') {
      continue
    } else if (arg === '--json') {
      args.json = true
    } else if (arg === '--snapshot') {
      args.snapshotPath = argv[index + 1]
      index += 1
    } else if (arg === '--help' || arg === '-h') {
      args.help = true
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return args
}

function usage() {
  return `Usage: node scripts/check-production-config.mjs --snapshot <path> [--json]

The snapshot must be a sanitized CloudBase production configuration export.
Secret values are never required; environmentVariables may be an object or a
list of variable names. The checker only reports variable names and statuses.
`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(usage())
    return
  }

  if (!args.snapshotPath) {
    throw new Error('Missing required --snapshot <path> argument.')
  }

  const snapshotPath = path.resolve(process.cwd(), args.snapshotPath)
  const report = evaluateProductionConfig(buildLocalSnapshot(snapshotPath))
  process.stdout.write(args.json ? renderJsonReport(report) : renderHumanReport(report))

  if (!report.ok) {
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
