import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')

export const manifestPath = resolve(projectRoot, 'config/cloudbase/schema.required.json')

export const parseArgs = (argv = process.argv.slice(2)) => {
  const args = new Map()
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index]
    if (!current.startsWith('--')) continue

    const [rawKey, inlineValue] = current.slice(2).split('=', 2)
    if (inlineValue !== undefined) {
      args.set(rawKey, inlineValue)
      continue
    }

    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      args.set(rawKey, '1')
      continue
    }

    args.set(rawKey, next)
    index += 1
  }
  return args
}

export const readSchemaManifest = async () => {
  const content = await readFile(manifestPath, 'utf8')
  return JSON.parse(content)
}

export const resolveEnvId = (args, manifest) =>
  args.get('envId') ||
  args.get('env-id') ||
  process.env.CLOUDBASE_ENV_ID ||
  process.env.TCB_ENV ||
  manifest.envId

export const isProductionLikeEnv = (envId) => {
  const markers = [envId, process.env.CLOUDBASE_SCHEMA_TARGET, process.env.NODE_ENV]
    .filter(Boolean)
    .map((value) => value.toLowerCase())

  return markers.some((value) => value.includes('prod') || value.includes('production'))
}

const isWindows = process.platform === 'win32'

export const runCommand = (command, args, options = {}) =>
  new Promise((resolveCommand) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      shell: false,
      windowsHide: true,
      ...options,
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => resolveCommand({ code, stdout, stderr }))
    child.on('error', (error) => resolveCommand({ code: 1, stdout, stderr: String(error) }))
  })

export const runTcb = (args) =>
  isWindows
    ? runCommand('cmd.exe', ['/d', '/s', '/c', 'npx.cmd', '-y', '-p', '@cloudbase/cli', 'tcb', ...args])
    : runCommand('npx', ['-y', '-p', '@cloudbase/cli', 'tcb', ...args])

export const queryCollection = async (envId, collectionName) => {
  const command = JSON.stringify([
    {
      TableName: collectionName,
      CommandType: 'COMMAND',
      Command: JSON.stringify({ listCollections: 1, filter: { name: collectionName } }),
    },
  ])

  return runTcb(['db', 'nosql', 'execute', '--envId', envId, '--command', command, '--json'])
}

export const invokeMallApi = async (envId, event) => {
  const payload = JSON.stringify(event)
  return runTcb(['fn', 'invoke', 'mallApi', '--envId', envId, '--params', payload, '--json'])
}

export const parseMallApiInvokeEnvelope = (result) => {
  try {
    const outer = JSON.parse(result.stdout)
    const retMsg = outer?.data?.RetMsg
    if (typeof retMsg !== 'string') return null
    return JSON.parse(retMsg)
  } catch (_error) {
    return null
  }
}

export const classifyCollectionProbe = (result) => {
  if (result.code === 0) {
    try {
      const parsed = JSON.parse(result.stdout)
      const collectionRecords = parsed?.data?.results?.[0]
      if (Array.isArray(collectionRecords)) {
        return collectionRecords.length > 0 ? 'exists' : 'missing'
      }
    } catch (_error) {
      return 'error'
    }

    return 'error'
  }

  const output = `${result.stdout}\n${result.stderr}`
  if (
    /DATABASE_COLLECTION_NOT_EXIST|Db or Table not exist|ResourceNotFound|collection.*not exist|table.*not exist/i.test(
      output,
    )
  ) {
    return 'missing'
  }

  return 'error'
}

export const checkRequiredCollections = async (envId, manifest) => {
  const results = []
  for (const collection of manifest.requiredCollections) {
    const probe = await queryCollection(envId, collection.name)
    results.push({
      name: collection.name,
      status: classifyCollectionProbe(probe),
      exitCode: probe.code,
      output: `${probe.stdout}\n${probe.stderr}`.trim(),
    })
  }
  return results
}

export const hasRawCloudBaseLeak = (value) =>
  /DATABASE_COLLECTION_NOT_EXIST|Db or Table not exist|ResourceNotFound|cloud\.tencent\.com\/document|stack trace/i.test(
    typeof value === 'string' ? value : JSON.stringify(value),
  )
