import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const {
  createAdminAccountRecord,
  createAdminAuditLogRecord,
  createAdminSessionRecord,
  generateAdminToken,
  hashAdminPassword,
  hashAdminToken,
  resolveAdminSession,
  sanitizeAdminAuditDetails,
  verifyAdminPassword,
} = require('./admin-auth-utils')

const NOW = '2026-06-03T00:00:00.000Z'
const EXPIRES_AT = '2026-06-03T01:00:00.000Z'

const fixedNow = () => NOW
const fixedSalt = () => 'phase-1-fixed-salt'
const fixedToken = () => 'phase-1-raw-admin-token'
const fixedId = (prefix) => `${prefix}-1`

const createValidSessionFixture = (overrides = {}) => {
  const account = {
    _id: 'account-1',
    account: 'owner@example.com',
    role: 'owner',
    permissions: ['workbenchAccess', 'productManagement'],
    status: 'active',
    ...overrides.account,
  }
  const session = {
    _id: 'session-1',
    account_id: account._id,
    account: account.account,
    token_hash: hashAdminToken('valid-token'),
    expires_at: EXPIRES_AT,
    created_at: NOW,
    ...overrides.session,
  }

  return { account, session, adminToken: 'valid-token' }
}

const resolveFixture = ({ account, session, adminToken = 'valid-token', now = fixedNow }) =>
  resolveAdminSession({
    adminToken,
    now,
    findSessionByTokenHash: async (tokenHash) => (tokenHash === session.token_hash ? session : null),
    findAccountById: async (accountId) => (accountId === account._id ? account : null),
  })

describe('admin auth utilities', () => {
  it('hashes passwords and verifies success and failure without storing the raw password', () => {
    const metadata = hashAdminPassword('correct-password', { saltSource: fixedSalt })

    expect(metadata).toMatchObject({
      password_algorithm: expect.stringMatching(/^pbkdf2-sha256:/),
      password_salt: 'phase-1-fixed-salt',
    })
    expect(metadata.password_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(metadata).not.toHaveProperty('password')
    expect(JSON.stringify(metadata)).not.toContain('correct-password')
    expect(verifyAdminPassword('correct-password', metadata)).toBe(true)
    expect(verifyAdminPassword('wrong-password', metadata)).toBe(false)
  })

  it('generates opaque tokens and hashes them deterministically', () => {
    const token = generateAdminToken({ tokenSource: fixedToken })

    expect(token).toBe('phase-1-raw-admin-token')
    expect(hashAdminToken(token)).toMatch(/^[a-f0-9]{64}$/)
    expect(hashAdminToken(token)).toBe(hashAdminToken('phase-1-raw-admin-token'))
    expect(hashAdminToken(token)).not.toBe(hashAdminToken('different-token'))
  })

  it('creates account and session records without storing raw passwords or raw tokens', () => {
    const account = createAdminAccountRecord(
      {
        account: 'owner@example.com',
        password: 'initial-password',
        role: 'owner',
        permissions: ['workbenchAccess'],
        createdBy: 'creator@example.com',
      },
      { createId: fixedId, now: fixedNow, saltSource: fixedSalt },
    )
    const { adminToken, session } = createAdminSessionRecord(
      {
        accountId: account._id,
        account: account.account,
        expiresAt: EXPIRES_AT,
      },
      { createId: fixedId, now: fixedNow, tokenSource: fixedToken },
    )

    expect(account).toMatchObject({
      _id: 'admin-account-1',
      account: 'owner@example.com',
      role: 'owner',
      permissions: ['workbenchAccess'],
      status: 'active',
      created_by: 'creator@example.com',
      created_at: NOW,
      updated_at: NOW,
    })
    expect(session).toMatchObject({
      _id: 'admin-session-1',
      account_id: account._id,
      account: account.account,
      token_hash: hashAdminToken(adminToken),
      expires_at: EXPIRES_AT,
      created_at: NOW,
    })
    expect(JSON.stringify(account)).not.toContain('initial-password')
    expect(JSON.stringify(session)).not.toContain(adminToken)
    expect(session).not.toHaveProperty('adminToken')
    expect(session).not.toHaveProperty('token')
  })

  it('sanitizes audit details and audit records without logging secrets', () => {
    const sanitized = sanitizeAdminAuditDetails({
      account: 'owner@example.com',
      password: 'raw-password',
      adminToken: 'raw-token',
      password_hash: 'stored-password-hash',
      nested: {
        token_hash: 'stored-token-hash',
        password_salt: 'stored-salt',
        safe: 'kept',
      },
      events: [{ secret: 'private-secret', result: 'failure' }],
    })
    const auditLog = createAdminAuditLogRecord(
      {
        operatorAccount: 'creator@example.com',
        action: 'adminLogin',
        targetAccount: 'owner@example.com',
        result: 'failure',
        details: sanitized,
      },
      { createId: fixedId, now: fixedNow },
    )
    const serialized = JSON.stringify(auditLog)

    expect(auditLog).toMatchObject({
      _id: 'admin-audit-log-1',
      operator_account: 'creator@example.com',
      action: 'adminLogin',
      target_account: 'owner@example.com',
      result: 'failure',
      created_at: NOW,
    })
    expect(auditLog.details).toMatchObject({
      account: 'owner@example.com',
      password: '[REDACTED]',
      adminToken: '[REDACTED]',
      password_hash: '[REDACTED]',
      nested: {
        token_hash: '[REDACTED]',
        password_salt: '[REDACTED]',
        safe: 'kept',
      },
      events: [{ secret: '[REDACTED]', result: 'failure' }],
    })
    expect(serialized).not.toContain('raw-password')
    expect(serialized).not.toContain('raw-token')
    expect(serialized).not.toContain('stored-password-hash')
    expect(serialized).not.toContain('stored-token-hash')
    expect(serialized).not.toContain('stored-salt')
    expect(serialized).not.toContain('private-secret')
  })

  it('validates an active session against current active account authority', async () => {
    const { account, session, adminToken } = createValidSessionFixture()

    await expect(resolveFixture({ account, session, adminToken })).resolves.toEqual({
      accountId: account._id,
      account: account.account,
      role: account.role,
      permissions: account.permissions,
      status: 'active',
      expiresAt: session.expires_at,
      sessionId: session._id,
    })
  })

  it('rejects expired sessions', async () => {
    const { account, session, adminToken } = createValidSessionFixture({
      session: { expires_at: '2026-06-02T23:59:59.000Z' },
    })

    await expect(resolveFixture({ account, session, adminToken })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects revoked sessions', async () => {
    const { account, session, adminToken } = createValidSessionFixture({
      session: { revoked_at: '2026-06-03T00:00:00.000Z' },
    })

    await expect(resolveFixture({ account, session, adminToken })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects sessions for disabled accounts', async () => {
    const { account, session, adminToken } = createValidSessionFixture({
      account: { status: 'disabled' },
    })

    await expect(resolveFixture({ account, session, adminToken })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })
})
