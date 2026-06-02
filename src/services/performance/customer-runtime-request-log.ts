export type CustomerRuntimeRequestSource = 'onLoad' | 'onShow' | 'retry' | 'pullRefresh' | 'command' | 'cache'

export type CustomerRuntimeRequestLogEntry = {
  action: string
  source: CustomerRuntimeRequestSource
  startedAt: number
  endedAt: number
  durationMs: number
  status: 'success' | 'failed'
  deduped: boolean
}

export type CustomerRuntimeRequestLogger = (entry: CustomerRuntimeRequestLogEntry) => void

type LogCustomerRuntimeRequestInput = {
  action: string
  source: CustomerRuntimeRequestSource
  startedAt: number
  endedAt?: number
  status: 'success' | 'failed'
  deduped: boolean
  now?: () => number
  logger?: CustomerRuntimeRequestLogger
}

export const logCustomerRuntimeRequest = ({
  action,
  source,
  startedAt,
  endedAt,
  status,
  deduped,
  now = () => Date.now(),
  logger,
}: LogCustomerRuntimeRequestInput): CustomerRuntimeRequestLogEntry => {
  const resolvedEndedAt = endedAt ?? now()
  const entry: CustomerRuntimeRequestLogEntry = {
    action,
    source,
    startedAt,
    endedAt: resolvedEndedAt,
    durationMs: Math.max(0, resolvedEndedAt - startedAt),
    status,
    deduped,
  }

  if (logger) {
    logger(entry)
  }

  return entry
}
