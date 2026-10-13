// Centralized application error type + factory helpers.
// Thrown anywhere in route handlers / services and caught by
// middleware/errorHandler.ts, which maps it to the standard
// { error: { code, message, details? } } response envelope.

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function badRequest(code: string, message: string, details?: unknown): AppError {
  return new AppError(400, code, message, details);
}

export function unauthorized(message = 'Authentication required'): AppError {
  return new AppError(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'You do not have access to this resource'): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'Resource not found'): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(code: string, message: string, details?: unknown): AppError {
  return new AppError(409, code, message, details);
}

export function unprocessable(code: string, message: string, details?: unknown): AppError {
  return new AppError(422, code, message, details);
}

export function internal(message = 'Internal server error'): AppError {
  return new AppError(500, 'INTERNAL_ERROR', message);
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
