import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { auditMpRuntime } from './mp-runtime-audit.mjs'

const withBuildRoot = (work) => {
  const buildRoot = mkdtempSync(path.join(os.tmpdir(), 'mp-runtime-audit-'))
  try {
    work(buildRoot)
  } finally {
    rmSync(buildRoot, { recursive: true, force: true })
  }
}

test('mp runtime audit fails on require("url")', () => {
  withBuildRoot((buildRoot) => {
    writeFileSync(path.join(buildRoot, 'bad.js'), 'const url = require("url")\n')

    const failures = auditMpRuntime(buildRoot)

    assert.equal(failures.length, 1)
    assert.match(failures[0], /unsupported Node built-in module "url"/)
  })
})

test('mp runtime audit fails on missing local require target', () => {
  withBuildRoot((buildRoot) => {
    mkdirSync(path.join(buildRoot, 'pages'), { recursive: true })
    writeFileSync(path.join(buildRoot, 'pages', 'bad.js'), 'require("../services/missing")\n')

    const failures = auditMpRuntime(buildRoot)

    assert.equal(failures.length, 1)
    assert.match(failures[0], /requires missing local module/)
  })
})

test('mp runtime audit accepts existing local require target', () => {
  withBuildRoot((buildRoot) => {
    mkdirSync(path.join(buildRoot, 'pages'), { recursive: true })
    mkdirSync(path.join(buildRoot, 'services'), { recursive: true })
    writeFileSync(path.join(buildRoot, 'pages', 'ok.js'), 'require("../services/present")\n')
    writeFileSync(path.join(buildRoot, 'services', 'present.js'), 'module.exports = {}\n')

    assert.deepEqual(auditMpRuntime(buildRoot), [])
  })
})
