import { backendErrorCodes, type BackendErrorCode } from '../http/errors'

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: BackendErrorCode,
    message: string,
  ) {
    super(message)
  }
}

export const validationError = (message: string): ApiError =>
  new ApiError(400, backendErrorCodes.VALIDATION_ERROR, message)

export const unauthorizedError = (message: string): ApiError =>
  new ApiError(401, backendErrorCodes.UNAUTHORIZED, message)

export const notFoundError = (message: string): ApiError => new ApiError(404, backendErrorCodes.NOT_FOUND, message)

export const conflictError = (message: string): ApiError => new ApiError(409, backendErrorCodes.CONFLICT, message)
