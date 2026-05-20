import assert from 'node:assert/strict'
import test from 'node:test'

import {
  evaluateProductionConfig,
  renderHumanReport,
  renderJsonReport,
} from './check-production-config.mjs'

const completeSnapshot = {
  targetEnvId: 'cloud1-d7gifjyzl7721b383',
  cloudbasercEnvId: 'cloud1-d7gifjyzl7721b383',
  manifestAppId: 'wxa63c53796488d4d4',
  manifestUrlCheck: true,
  functions: [
    {
      name: 'mallApi',
      envId: 'cloud1-d7gifjyzl7721b383',
      environmentVariables: {
        WECHAT_APPID: 'wxa63c53796488d4d4',
        WECHAT_APPSECRET: 'should-never-print',
        OCR_PROVIDER: 'tencentcloud-general-basic',
        OCR_PROVIDER_ENDPOINT: 'https://ocr.tencentcloudapi.com',
        OCR_TENCENT_SECRET_ID: 'also-should-never-print-id',
        OCR_TENCENT_SECRET_KEY: 'also-should-never-print-key',
      },
    },
  ],
  domains: {
    request: ['https://api.example.com'],
    upload: ['https://upload.example.com'],
    download: ['https://download.example.com'],
  },
  storage: {
    bucketReady: true,
    httpsTlsVerified: true,
  },
}

test('fails when required production secrets are missing and names the variables only', () => {
  const snapshot = structuredClone(completeSnapshot)
  delete snapshot.functions[0].environmentVariables.WECHAT_APPSECRET
  delete snapshot.functions[0].environmentVariables.OCR_TENCENT_SECRET_KEY

  const report = evaluateProductionConfig(snapshot)

  assert.equal(report.ok, false)
  assert.deepEqual(
    report.blockers.map((blocker) => blocker.code),
    ['MISSING_FUNCTION_ENV', 'MISSING_FUNCTION_ENV'],
  )
  assert.deepEqual(
    report.blockers.map((blocker) => blocker.variable),
    ['WECHAT_APPSECRET', 'OCR_TENCENT_SECRET_KEY'],
  )
  assert.equal(JSON.stringify(report).includes('should-never-print'), false)
  assert.equal(JSON.stringify(report).includes('also-should-never-print-id'), false)
  assert.equal(JSON.stringify(report).includes('also-should-never-print-key'), false)
})

test('fails when the CloudBase target env does not match the repository target', () => {
  const snapshot = structuredClone(completeSnapshot)
  snapshot.functions[0].envId = 'cloud1-wrong-target'

  const report = evaluateProductionConfig(snapshot)

  assert.equal(report.ok, false)
  assert.deepEqual(report.blockers, [
    {
      code: 'FUNCTION_ENV_MISMATCH',
      message: 'mallApi is configured for cloud1-wrong-target but target env is cloud1-d7gifjyzl7721b383.',
      expected: 'cloud1-d7gifjyzl7721b383',
      actual: 'cloud1-wrong-target',
      functionName: 'mallApi',
    },
  ])
})

test('fails when urlCheck, domains, or storage are not production-ready', () => {
  const snapshot = structuredClone(completeSnapshot)
  snapshot.manifestUrlCheck = false
  snapshot.domains.upload = []
  snapshot.storage.httpsTlsVerified = false

  const report = evaluateProductionConfig(snapshot)

  assert.equal(report.ok, false)
  assert.deepEqual(
    report.blockers.map((blocker) => blocker.code),
    ['URL_CHECK_DISABLED', 'MISSING_DOMAIN_GROUP', 'STORAGE_TLS_NOT_VERIFIED'],
  )
})

test('renders human and JSON reports without leaking secret values', () => {
  const report = evaluateProductionConfig(completeSnapshot)
  const human = renderHumanReport(report)
  const json = renderJsonReport(report)

  assert.equal(report.ok, true)
  assert.match(human, /Production config gate: PASS/)
  assert.match(json, /"ok": true/)
  assert.equal(human.includes('should-never-print'), false)
  assert.equal(json.includes('also-should-never-print-id'), false)
  assert.equal(json.includes('also-should-never-print-key'), false)
})
