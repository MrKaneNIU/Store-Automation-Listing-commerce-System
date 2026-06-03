const crypto = require('node:crypto')

const PASSWORD_DIGEST = 'sha256'
const PASSWORD_ITERATIONS = 310000
const PASSWORD_KEY_LENGTH = 32
const TOKEN_BYTE_LENGTH = 32
const DEFAULT_SESSION_TTL_MS = 12 * 60 * 60 * 1000
const REDACTED = '[REDACTED]'
const SENSITIVE_AUDIT_KEY = /(password|token|secret|hash|salt)/i

const createDefaultId = (prefix) => `${prefix}-${crypto.randomUUID()}`

const readNow = (now) => (typeof now === 'function' ? now() : new Date().toISOString())

const readSourceValue = (source, fallback) => {
  const value = typeof source === 'function' ? source() : fallback()
  return Buffer.isBuffer(value) ? value.toString('base64url') : String(value)
}

const createAdminAuthError = (message = 'Invalid admin session') => {
  const error = new Error(message)
  error.code = 'UNAUTHORIZED'
  return error
}

const hashPasswordWithMetadata = ({ password, salt, iterations, keyLength }) =>
  crypto.pbkdf2Sync(password, salt, iterations, keyLength, PASSWORD_DIGEST).toString('hex')

const parsePasswordAlgorithm = (algorithm) => {
  const match = /^pbkdf2-sha256:(\d+):(\d+)$/.exec(algorithm || '')
  if (!match) return null
  return {
    iterations: Number(match[1]),
    keyLength: Number(match[2]),
  }
}

const hashAdminPassword = (password, options = {}) => {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password is required')
  }
  const password_salt = readSourceValue(options.saltSource, () => crypto.randomBytes(16))
  const password_algorithm = `pbkdf2-sha256:${PASSWORD_ITERATIONS}:${PASSWORD_KEY_LENGTH}`
  return {
    password_hash: hashPasswordWithMetadata({
      password,
      salt: password_salt,
      iterations: PASSWORD_ITERATIONS,
      keyLength: PASSWORD_KEY_LENGTH,
    }),
    password_salt,
    password_algorithm,
  }
}

const verifyAdminPassword = (password, metadata) => {
  if (typeof password !== 'string' || !metadata || typeof metadata !== 'object') return false
  const parsed = parsePasswordAlgorithm(metadata.password_algorithm)
  if (!parsed || typeof metadata.password_salt !== 'string' || typeof metadata.password_hash !== 'string') return false
  const candidate = hashPasswordWithMetadata({
    password,
    salt: metadata.password_salt,
    iterations: parsed.iterations,
    keyLength: parsed.keyLength,
  })
  const expected = Buffer.from(metadata.password_hash, 'hex')
  const actual = Buffer.from(candidate, 'hex')
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

const generateAdminToken = (options = {}) =>
  readSourceValue(options.tokenSource, () => crypto.randomBytes(TOKEN_BYTE_LENGTH))

const hashAdminToken = (token) => {
  if (typeof token !== 'string' || token.length === 0) throw new Error('Admin token is required')
  return crypto.createHash('sha256').update(token).digest('hex')
}

const createAdminAccountRecord = (input, options = {}) => {
  const timestamp = readNow(options.now)
  const createId = options.createId || createDefaultId
  const passwordMetadata = hashAdminPassword(input.password, { saltSource: options.saltSource })

  return {
    _id: input.id || createId('admin-account'),
    account: input.account,
    display_name: input.displayName,
    ...passwordMetadata,
    role: input.role,
    permissions: [...(input.permissions || [])],
    status: input.status || 'active',
    failed_login_count: input.failedLoginCount || 0,
    lock_until: input.lockUntil,
    last_login_at: input.lastLoginAt,
    last_login_ip: input.lastLoginIp,
    created_by: input.createdBy,
    created_at: input.createdAt || timestamp,
    updated_at: input.updatedAt || timestamp,
  }
}

const createAdminSessionRecord = (input, options = {}) => {
  const timestamp = readNow(options.now)
  const createId = options.createId || createDefaultId
  const adminToken = input.adminToken || generateAdminToken({ tokenSource: options.tokenSource })
  const expiresAt =
    input.expiresAt || new Date(Date.parse(timestamp) + (input.ttlMs || DEFAULT_SESSION_TTL_MS)).toISOString()

  return {
    adminToken,
    session: {
      _id: input.id || createId('admin-session'),
      account_id: input.accountId,
      account: input.account,
      token_hash: hashAdminToken(adminToken),
      expires_at: expiresAt,
      revoked_at: input.revokedAt,
      created_at: input.createdAt || timestamp,
      last_seen_at: input.lastSeenAt,
      created_ip: input.createdIp,
      user_agent: input.userAgent,
    },
  }
}

const isPlainRecord = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const sanitizeAdminAuditDetails = (details) => {
  if (Array.isArray(details)) return details.map((item) => sanitizeAdminAuditDetails(item))
  if (!isPlainRecord(details)) return details

  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      SENSITIVE_AUDIT_KEY.test(key) ? REDACTED : sanitizeAdminAuditDetails(value),
    ]),
  )
}

const createAdminAuditLogRecord = (input, options = {}) => {
  const createId = options.createId || createDefaultId
  return {
    _id: input.id || createId('admin-audit-log'),
    operator_account: input.operatorAccount,
    action: input.action,
    target_account: input.targetAccount,
    result: input.result,
    details: sanitizeAdminAuditDetails(input.details),
    created_at: input.createdAt || readNow(options.now),
  }
}

const isSessionExpired = (expiresAt, now) => {
  const expiresAtTime = Date.parse(expiresAt)
  const nowTime = Date.parse(now)
  return !Number.isFinite(expiresAtTime) || !Number.isFinite(nowTime) || expiresAtTime <= nowTime
}

const resolveAdminSession = async ({ adminToken, now, findSessionByTokenHash, findAccountById }) => {
  if (!adminToken) throw createAdminAuthError()
  const tokenHash = hashAdminToken(adminToken)
  const session = await findSessionByTokenHash(tokenHash)
  if (!session || session.revoked_at || isSessionExpired(session.expires_at, readNow(now))) {
    throw createAdminAuthError()
  }

  const account = await findAccountById(session.account_id)
  if (!account || account.status !== 'active') throw createAdminAuthError()

  return {
    accountId: account._id,
    account: account.account,
    role: account.role,
    permissions: [...(account.permissions || [])],
    status: account.status,
    expiresAt: session.expires_at,
    sessionId: session._id,
  }
}

module.exports = {
  createAdminAccountRecord,
  createAdminAuditLogRecord,
  createAdminSessionRecord,
  generateAdminToken,
  hashAdminPassword,
  hashAdminToken,
  resolveAdminSession,
  sanitizeAdminAuditDetails,
  verifyAdminPassword,
}
