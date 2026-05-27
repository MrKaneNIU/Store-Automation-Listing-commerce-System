export type PerformanceTimer = {
  now: () => number
}

export type ManualPerformanceTimer = PerformanceTimer & {
  advanceBy: (durationMs: number) => void
  set: (timestampMs: number) => void
}

export type PageCacheStatus = 'hit' | 'miss' | 'stale' | 'expired' | 'none'

export type TraceStatus = 'success' | 'failed'

export type ParamsShape =
  | string
  | number
  | boolean
  | null
  | {
      readonly [key: string]: ParamsShape
    }
  | {
      readonly type: 'array'
      readonly length: number
    }

export type RemoteCallTrace = {
  readonly action: string
  readonly paramsShape: Record<string, ParamsShape>
  readonly startedAt: number
  readonly endedAt: number
  readonly durationMs: number
  readonly status: TraceStatus
  readonly errorCode?: string
}

export type ImageResolutionTrace = {
  readonly imageCount: number
  readonly startedAt: number
  readonly endedAt: number
  readonly durationMs: number
  readonly status: TraceStatus
  readonly errorCode?: string
}

export type PageLoadTrace = {
  readonly pageName: string
  readonly startedAt: number
  readonly cacheStatus: PageCacheStatus
  readonly remoteCalls: RemoteCallTrace[]
  readonly imageResolutions: ImageResolutionTrace[]
  readonly endedAt?: number
  readonly durationMs?: number
  readonly failureReason?: string
}

export type RemoteActionCountSummary = {
  readonly total: number
  readonly byAction: Record<string, number>
}

const sensitiveKeyPattern = /secret|token|openid|phone|password|authorization|sign/i
const signedUrlPattern = /^https:\/\/.+\.tcb\.qcloud\.la\/.+[?&]sign=/i

export const createManualPerformanceTimer = (initialTimestampMs = 0): ManualPerformanceTimer => {
  let currentTimestampMs = initialTimestampMs

  return {
    now: () => currentTimestampMs,
    advanceBy: (durationMs: number) => {
      currentTimestampMs += durationMs
    },
    set: (timestampMs: number) => {
      currentTimestampMs = timestampMs
    },
  }
}

export const createPageLoadTrace = (input: {
  readonly pageName: string
  readonly cacheStatus: PageCacheStatus
  readonly timer?: PerformanceTimer
}): PageLoadTrace => ({
  pageName: input.pageName,
  cacheStatus: input.cacheStatus,
  startedAt: input.timer?.now() ?? Date.now(),
  remoteCalls: [],
  imageResolutions: [],
})

const describeValueShape = (key: string, value: unknown): ParamsShape => {
  if (sensitiveKeyPattern.test(key)) {
    return '[redacted]'
  }

  if (value === null || value === undefined) {
    return null
  }

  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
    }
  }

  if (typeof value === 'string') {
    return signedUrlPattern.test(value.trim()) ? 'url' : 'string'
  }

  if (typeof value === 'number') {
    return 'number'
  }

  if (typeof value === 'boolean') {
    return 'boolean'
  }

  if (typeof value === 'object') {
    return describeParamsShape(value as Record<string, unknown>)
  }

  return typeof value
}

export const describeParamsShape = (
  params: Record<string, unknown> | undefined,
): Record<string, ParamsShape> => {
  if (!params) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, describeValueShape(key, value)]),
  )
}

export const recordRemoteCallTrace = (
  trace: PageLoadTrace,
  input: {
    readonly action: string
    readonly params?: Record<string, unknown>
    readonly status: TraceStatus
    readonly timer?: PerformanceTimer
    readonly startedAt?: number
    readonly errorCode?: string
  },
): PageLoadTrace => {
  const endedAt = input.timer?.now() ?? Date.now()
  const startedAt = input.startedAt ?? trace.startedAt
  const remoteCall: RemoteCallTrace = {
    action: input.action,
    paramsShape: describeParamsShape(input.params),
    startedAt,
    endedAt,
    durationMs: Math.max(0, endedAt - startedAt),
    status: input.status,
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
  }

  return {
    ...trace,
    remoteCalls: [...trace.remoteCalls, remoteCall],
  }
}

export const recordImageResolutionTrace = (
  trace: PageLoadTrace,
  input: {
    readonly imageCount: number
    readonly status: TraceStatus
    readonly timer?: PerformanceTimer
    readonly startedAt?: number
    readonly errorCode?: string
  },
): PageLoadTrace => {
  const endedAt = input.timer?.now() ?? Date.now()
  const startedAt = input.startedAt ?? trace.startedAt
  const imageResolution: ImageResolutionTrace = {
    imageCount: input.imageCount,
    startedAt,
    endedAt,
    durationMs: Math.max(0, endedAt - startedAt),
    status: input.status,
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
  }

  return {
    ...trace,
    imageResolutions: [...trace.imageResolutions, imageResolution],
  }
}

export const finishPageLoadTrace = (
  trace: PageLoadTrace,
  input: {
    readonly timer?: PerformanceTimer
    readonly failureReason?: string
  } = {},
): PageLoadTrace => {
  const endedAt = input.timer?.now() ?? Date.now()

  return {
    ...trace,
    endedAt,
    durationMs: Math.max(0, endedAt - trace.startedAt),
    ...(input.failureReason ? { failureReason: input.failureReason } : {}),
  }
}

export const summarizeRemoteActionCount = (trace: PageLoadTrace): RemoteActionCountSummary => ({
  total: trace.remoteCalls.length,
  byAction: trace.remoteCalls.reduce<Record<string, number>>(
    (byAction, remoteCall) => ({
      ...byAction,
      [remoteCall.action]: (byAction[remoteCall.action] ?? 0) + 1,
    }),
    {},
  ),
})
