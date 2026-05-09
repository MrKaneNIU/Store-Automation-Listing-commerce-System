export const backendErrorCodes = {
  CONFLICT: 'CONFLICT',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const

export type BackendErrorCode = (typeof backendErrorCodes)[keyof typeof backendErrorCodes]

export class BackendConfigurationError extends Error {
  code = backendErrorCodes.CONFIGURATION_ERROR
}
