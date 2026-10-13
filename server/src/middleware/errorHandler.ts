import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { isAppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import type { ApiErrorBody } from '../types/api.js';

/** 404 handler for unmatched routes — must be mounted after all routes. */
export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorBody = {
    error: {
      code: 'NOT_FOUND',
      message: `No route for ${req.method} ${req.path}`,
    },
  };
  res.status(404).json(body);
}

/**
 * Centralized error handler. Maps AppError instances to their declared
 * status/code/details; everything else becomes an opaque 500. Stack
 * traces are only logged (never sent to the client) and are fully
 * suppressed in production logs' response body.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (isAppError(err)) {
    if (err.statusCode >= 500) {
      logger.error({ err, code: err.code, path: req.path }, 'request failed');
    } else {
      logger.warn({ code: err.code, path: req.path, status: err.statusCode }, 'request rejected');
    }
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error({ err, path: req.path }, 'unhandled error');

  const message =
    config.isProduction || config.isTest
      ? 'An unexpected error occurred'
      : err instanceof Error
        ? err.message
        : 'An unexpected error occurred';

  const body: ApiErrorBody = {
    error: { code: 'INTERNAL_ERROR', message },
  };
  res.status(500).json(body);
}
