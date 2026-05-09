import { describe, expect, it } from 'vitest'

import { runStagingRestoreRehearsal } from './staging-restore-rehearsal'

describe('staging restore rehearsal', () => {
  it('restores a backup into a rehearsal database and validates Phase 2 data', async () => {
    const result = await runStagingRestoreRehearsal({
      backupArtifactId: 'local-pgmem-backup-2026-05-09',
      operator: 'codex-local',
      sourceEnvironment: 'local-staging-simulation',
      targetEnvironment: 'local-restore-rehearsal',
    })

    expect(result.backupArtifactId).toBe('local-pgmem-backup-2026-05-09')
    expect(result.checks.map((check) => check.name)).toEqual([
      'schema_migrations',
      'invalid_draft_prices',
      'invalid_draft_stock',
      'invalid_sku_stock',
      'duplicate_sku_keys',
      'duplicate_product_codes',
      'orphan_drafts',
      'orphan_order_items',
      'invalid_order_totals',
    ])
    expect(result.checks).toEqual(
      result.checks.map((check) => ({
        ...check,
        status: 'passed',
        observed: check.expected,
      })),
    )
    expect(result.status).toBe('passed')
  })
})
