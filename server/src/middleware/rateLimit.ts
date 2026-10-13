import rateLimit, { type Options } from 'express-rate-limit';
import type { Request, Response } from 'express';
import { config } from '../config.js';
import type { ApiErrorBody } from '../types/api.js';

function rateLimitHandler(_req: Request, res: Response): void {
  const body: ApiErrorBody = {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  };
  res.status(429).json(body);
}

function buildLimiter(max: number, overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs: config.rateLimitWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    // Rate limiting is a production concern; disabling it under the test
    // runner keeps the suite deterministic regardless of how many
    // requests a given test file issues within the configured window.
    skip: () => config.isTest,
    ...overrides,
  });
}

/** General-purpose limiter applied across all `/api` routes. */
export const generalRateLimiter = buildLimiter(config.rateLimitMax);

/** Stricter limiter for guest order creation (POST /api/orders). */
export const orderRateLimiter = buildLimiter(config.orderRateLimitMax);

/** Limiter for order tracking lookups (GET /api/orders/track/:token). */
export const trackRateLimiter = buildLimiter(config.trackRateLimitMax);
